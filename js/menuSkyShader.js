/**
 * 主菜单背景：云间飞船（优先 WebGL，失败则用 Canvas2D）
 * 支持菜单动效：镜头推近、舰体转向面对镜头、舷窗高亮。
 */
export const MenuSkyShader = (() => {
    let canvas = null;
    let gl = null;
    let program = null;
    let buf = null;
    let uTime = null;
    let uRes = null;
    let uPose = null; // vec4: zoom, yaw, face, window
    let raf = 0;
    let running = false;
    let startMs = 0;
    let mode = "none"; // webgl | canvas2d | none
    let ctx2d = null;
    let resizeObs = null;
    let visibilityBound = false;

    // pose: zoom(1=idle), yaw(rad), face(0=side→1=front), window(0→1 hull glow)
    const pose = { zoom: 1, yaw: 0, face: 0, window: 0, ox: 0, oy: 0 };
    let poseAnim = null;

    const VS = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

    const FS = `
precision mediump float;
uniform float u_time;
uniform vec2 u_res;
uniform vec4 u_pose; // zoom, yaw, face, window

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  float a = hash(i), b = hash(i+vec2(1.,0.)), c = hash(i+vec2(0.,1.)), d = hash(i+vec2(1.,1.));
  vec2 u = f*f*(3.-2.*f);
  return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
}
float fbm(vec2 p){
  float v=0., a=.5;
  v+=a*noise(p); p*=2.02; a*=.5;
  v+=a*noise(p); p*=2.02; a*=.5;
  v+=a*noise(p); p*=2.02; a*=.5;
  v+=a*noise(p);
  return v;
}
float sdCapsule(vec2 p, vec2 a, vec2 b, float r){
  vec2 pa=p-a, ba=b-a;
  float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);
  return length(pa-ba*h)-r;
}
float sdEllipse(vec2 p, vec2 r){ return (length(p/r)-1.)*min(r.x,r.y); }
float sdBox(vec2 p, vec2 b){
  vec2 d = abs(p)-b;
  return length(max(d,0.))+min(max(d.x,d.y),0.);
}
float shipSide(vec2 p){
  float hull = sdCapsule(p, vec2(-.34,.0), vec2(.42,.02), .07);
  float bridge = sdEllipse(p-vec2(.06,.09), vec2(.14,.055));
  float finT = sdCapsule(p, vec2(-.28,.03), vec2(-.48,.18), .02);
  float finB = sdCapsule(p, vec2(-.28,-.03), vec2(-.46,-.16), .02);
  float nose = sdEllipse(p-vec2(.46,.02), vec2(.11,.04));
  float eng = sdEllipse(p-vec2(-.40,.0), vec2(.08,.06));
  return min(hull, min(bridge, min(finT, min(finB, min(nose, eng)))));
}
float shipFront(vec2 p){
  // 舰体正对镜头：宽椭圆壳体 + 中央桥楼 + 两侧翼
  float hull = sdEllipse(p, vec2(.42,.22));
  float core = sdEllipse(p-vec2(0.,.02), vec2(.22,.14));
  float wingL = sdEllipse(p-vec2(-.38,.0), vec2(.18,.06));
  float wingR = sdEllipse(p-vec2(.38,.0), vec2(.18,.06));
  float bridge = sdEllipse(p-vec2(0.,.12), vec2(.12,.05));
  return min(hull, min(core, min(wingL, min(wingR, bridge))));
}
vec2 rot2(vec2 p, float a){
  float c=cos(a), s=sin(a);
  return vec2(c*p.x - s*p.y, s*p.x + c*p.y);
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  float aspect = u_res.x / max(u_res.y, 1.);
  vec2 p = uv*2.-1.;
  p.x *= aspect;
  float t = u_time;
  float zoom = max(u_pose.x, 0.2);
  float yaw = u_pose.y;
  float face = clamp(u_pose.z, 0., 1.);
  float winAmt = clamp(u_pose.w, 0., 1.);

  // 鲜艳暮色天空
  vec3 c0 = vec3(0.05, 0.07, 0.18);
  vec3 c1 = vec3(0.18, 0.28, 0.55);
  vec3 c2 = vec3(0.95, 0.45, 0.22);
  vec3 c3 = vec3(1.0, 0.72, 0.35);
  vec3 sky = mix(c3, c2, smoothstep(0.0, 0.32, uv.y));
  sky = mix(sky, c1, smoothstep(0.25, 0.62, uv.y));
  sky = mix(sky, c0, smoothstep(0.55, 1.0, uv.y));

  vec2 sp = uv * vec2(70.*aspect, 70.);
  float sn = hash(floor(sp));
  if (sn > 0.97 && uv.y > 0.42) {
    sky += (0.5+0.5*sin(t*3.+sn*50.)) * smoothstep(0.97,1.,sn) * vec3(0.8,0.9,1.2);
  }

  // 厚云（动效期用廉价噪声，避免 fbm 卡顿）
  float drift = t * 0.08;
  float cloud;
  if (zoom > 1.15 || face > 0.2) {
    cloud = noise(vec2(uv.x*2.2*aspect + drift, uv.y*1.6));
    cloud = smoothstep(0.45, 0.82, cloud);
  } else {
    cloud = fbm(vec2(uv.x*2.6*aspect + drift, uv.y*1.8));
    cloud += 0.45 * fbm(vec2(uv.x*4.2*aspect - drift*0.6, uv.y*2.8 + 3.));
    cloud = smoothstep(0.42, 0.78, cloud);
  }
  float band = smoothstep(0.02, 0.28, uv.y) * (1. - smoothstep(0.48, 0.88, uv.y));
  cloud *= band;
  vec3 cloudCol = mix(vec3(0.55,0.35,0.4), vec3(1.0,0.88,0.75), cloud);
  sky = mix(sky, cloudCol, cloud * 0.92);
  sky += exp(-abs(uv.y-0.24)*10.) * vec3(1.0, 0.55, 0.2) * 0.55;

  // 闲置摆动随 pose 减弱
  float idle = 1.0 - smoothstep(0.05, 0.55, face + (zoom-1.0)*0.4);
  float shipX = sin(t*0.25)*0.18 * idle;
  float shipY = 0.02 + sin(t*0.35)*0.04 * idle;
  vec2 su = p - vec2(shipX, shipY);
  su = rot2(su, yaw);
  su /= zoom;
  su *= mix(0.95, 0.72, face);

  float sdSide = shipSide(su);
  float sdFront = shipFront(su * vec2(1.0, 1.15));
  float sd = mix(sdSide, sdFront, face);
  float ship = 1. - smoothstep(0., 0.018, sd);
  float soft = 1. - smoothstep(0., 0.07, sd);

  // 引擎焰（正面时减弱侧焰）
  vec2 ep = su - vec2(-0.52, 0.0);
  float ex = exp(-dot(ep*vec2(1.6,5.5), ep*vec2(1.6,5.5)));
  ex *= 0.65 + 0.35*sin(t*22. + ep.x*30.);
  ex *= (1.0 - face * 0.85);
  sky += ex * vec3(0.3, 0.85, 1.2) * 0.95;
  sky += ex * vec3(1.0, 0.5, 0.15) * 0.45;

  sky = mix(sky, vec3(0.02,0.03,0.06), ship);

  // 侧视舷窗
  float winDot = 1. - smoothstep(0., 0.01, length(su-vec2(0.08,0.08))-0.018);
  sky += winDot * ship * (1.0-face) * vec3(0.45, 0.95, 1.2) * 1.2;

  // 正面舰体中央「舷窗面板」发光区（供 DOM 窗口对齐）
  float panel = 1. - smoothstep(0., 0.02, sdBox(su - vec2(0.0, 0.02), vec2(0.26, 0.16)));
  panel *= ship * face;
  sky = mix(sky, vec3(0.04, 0.12, 0.2), panel * 0.85);
  sky += panel * winAmt * vec3(0.35, 0.85, 1.15) * 0.55;
  // 面板边框
  float rim = abs(sdBox(su - vec2(0.0, 0.02), vec2(0.26, 0.16)));
  float rimGlow = (1. - smoothstep(0.0, 0.012, rim)) * ship * face * winAmt;
  sky += rimGlow * vec3(0.5, 0.95, 1.2) * 0.9;

  sky = mix(sky, sky*0.9, soft*0.2*(1.-ship));
  float vig = smoothstep(1.5, 0.25, length(p*vec2(0.65,1.0)));
  sky *= mix(0.75, 1.0, vig);

  gl_FragColor = vec4(sky, 1.0);
}
`;

    function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.warn("[MenuSky]", gl.getShaderInfoLog(s));
            gl.deleteShader(s);
            return null;
        }
        return s;
    }

    function isMobile() {
        return window.matchMedia("(max-width: 900px), (hover: none) and (pointer: coarse)").matches;
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function applyPoseUniforms() {
        if (mode === "webgl" && gl && program && uPose) {
            gl.useProgram(program);
            gl.uniform4f(uPose, pose.zoom, pose.yaw, pose.face, pose.window);
        }
    }

    function tickPose(now) {
        if (!poseAnim) return;
        const { from, to, start, duration, resolve } = poseAnim;
        const u = Math.min(1, (now - start) / duration);
        const e = easeOutCubic(u);
        pose.zoom = from.zoom + (to.zoom - from.zoom) * e;
        pose.yaw = from.yaw + (to.yaw - from.yaw) * e;
        pose.face = from.face + (to.face - from.face) * e;
        pose.window = from.window + (to.window - from.window) * e;
        pose.ox = from.ox + (to.ox - from.ox) * e;
        pose.oy = from.oy + (to.oy - from.oy) * e;
        applyPoseUniforms();
        if (u >= 1) {
            poseAnim = null;
            if (resolve) resolve(pose);
        }
    }

    function animatePose(target = {}, opts = {}) {
        const duration = Math.max(120, opts.duration || 780);
        const to = {
            zoom: target.zoom != null ? target.zoom : pose.zoom,
            yaw: target.yaw != null ? target.yaw : pose.yaw,
            face: target.face != null ? target.face : pose.face,
            window: target.window != null ? target.window : pose.window,
            ox: target.ox != null ? target.ox : pose.ox,
            oy: target.oy != null ? target.oy : pose.oy,
        };
        const from = { ...pose };
        return new Promise((resolve) => {
            poseAnim = {
                from,
                to,
                start: performance.now(),
                duration,
                resolve,
            };
            if (!running) start();
        });
    }

    function setPose(partial = {}) {
        Object.assign(pose, partial);
        applyPoseUniforms();
    }

    function getPose() {
        return { ...pose };
    }

    function resetPose(immediate = true) {
        const idle = { zoom: 1, yaw: 0, face: 0, window: 0, ox: 0, oy: 0 };
        if (immediate) {
            poseAnim = null;
            Object.assign(pose, idle);
            applyPoseUniforms();
            return Promise.resolve(pose);
        }
        return animatePose(idle, { duration: 650 });
    }

    let cineLite = false;
    let lastDrawMs = 0;

    function setCinematicLite(on) {
        cineLite = !!on;
        resize();
    }

    function resize() {
        if (!canvas) return;
        const vv = window.visualViewport;
        const w = Math.max(
            2,
            Math.round((vv && vv.width) || window.innerWidth || document.documentElement.clientWidth || 2)
        );
        const h = Math.max(
            2,
            Math.round((vv && vv.height) || window.innerHeight || document.documentElement.clientHeight || 2)
        );
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        // 动效期降分辨率，显著减卡
        let scale = isMobile() ? 0.55 : 0.7;
        if (cineLite) scale = isMobile() ? 0.32 : 0.42;
        const bw = Math.max(2, Math.floor(w * scale));
        const bh = Math.max(2, Math.floor(h * scale));
        if (canvas.width !== bw || canvas.height !== bh) {
            canvas.width = bw;
            canvas.height = bh;
        }
        if (mode === "webgl" && gl) {
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.useProgram(program);
            if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
            applyPoseUniforms();
        }
    }

    function draw2d(t) {
        if (!ctx2d) return;
        const w = canvas.width;
        const h = canvas.height;
        const g = ctx2d.createLinearGradient(0, h, 0, 0);
        g.addColorStop(0, "#ffb85a");
        g.addColorStop(0.28, "#e86a3a");
        g.addColorStop(0.55, "#3a5a8c");
        g.addColorStop(1, "#0c1228");
        ctx2d.fillStyle = g;
        ctx2d.fillRect(0, 0, w, h);

        const drift = t * 28;
        for (let i = 0; i < 10; i++) {
            const y = h * (0.22 + (i % 5) * 0.08);
            const x = ((i * 137 + drift * (0.4 + (i % 3) * 0.2)) % (w + 200)) - 100;
            const rw = 80 + (i % 4) * 40;
            const rh = 28 + (i % 3) * 14;
            const grd = ctx2d.createRadialGradient(x, y, 4, x, y, rw);
            grd.addColorStop(0, "rgba(255,230,200,0.75)");
            grd.addColorStop(1, "rgba(255,180,140,0)");
            ctx2d.fillStyle = grd;
            ctx2d.beginPath();
            ctx2d.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2);
            ctx2d.fill();
        }

        const idle = 1 - Math.min(1, pose.face + (pose.zoom - 1) * 0.4);
        const sx = w * (0.5 + Math.sin(t * 0.35) * 0.12 * idle);
        const sy = h * (0.48 + Math.sin(t * 0.45) * 0.03 * idle);
        const s = Math.min(w, h) * 0.22 * pose.zoom * (1 + pose.face * 0.35);
        ctx2d.save();
        ctx2d.translate(sx, sy);
        ctx2d.rotate(pose.yaw);
        if (pose.face < 0.55) {
            const flame = ctx2d.createRadialGradient(-s * 0.55, 0, 0, -s * 0.55, 0, s * 0.45);
            flame.addColorStop(0, "rgba(180,240,255,0.95)");
            flame.addColorStop(0.4, "rgba(80,180,255,0.55)");
            flame.addColorStop(1, "rgba(40,100,255,0)");
            ctx2d.globalAlpha = 1 - pose.face * 0.85;
            ctx2d.fillStyle = flame;
            ctx2d.beginPath();
            ctx2d.ellipse(-s * 0.55, 0, s * (0.35 + 0.08 * Math.sin(t * 20)), s * 0.12, 0, 0, Math.PI * 2);
            ctx2d.fill();
            ctx2d.globalAlpha = 1;
            ctx2d.fillStyle = "#05070e";
            ctx2d.beginPath();
            ctx2d.moveTo(-s * 0.45, 0);
            ctx2d.quadraticCurveTo(-s * 0.2, -s * 0.12, s * 0.15, -s * 0.08);
            ctx2d.quadraticCurveTo(s * 0.45, -s * 0.02, s * 0.55, 0.02 * s);
            ctx2d.quadraticCurveTo(s * 0.4, s * 0.08, s * 0.05, s * 0.07);
            ctx2d.quadraticCurveTo(-s * 0.25, s * 0.1, -s * 0.45, 0);
            ctx2d.fill();
            ctx2d.beginPath();
            ctx2d.moveTo(-s * 0.25, -s * 0.02);
            ctx2d.lineTo(-s * 0.5, -s * 0.22);
            ctx2d.lineTo(-s * 0.15, -s * 0.05);
            ctx2d.fill();
            ctx2d.beginPath();
            ctx2d.moveTo(-s * 0.25, s * 0.02);
            ctx2d.lineTo(-s * 0.48, s * 0.2);
            ctx2d.lineTo(-s * 0.15, s * 0.05);
            ctx2d.fill();
            ctx2d.fillStyle = "#7cf0ff";
            ctx2d.beginPath();
            ctx2d.arc(s * 0.12, -s * 0.04, s * 0.035, 0, Math.PI * 2);
            ctx2d.fill();
        } else {
            // 正面舰影
            ctx2d.fillStyle = "#05070e";
            ctx2d.beginPath();
            ctx2d.ellipse(0, 0, s * 0.72, s * 0.38, 0, 0, Math.PI * 2);
            ctx2d.fill();
            ctx2d.beginPath();
            ctx2d.ellipse(-s * 0.55, 0, s * 0.28, s * 0.1, 0, 0, Math.PI * 2);
            ctx2d.fill();
            ctx2d.beginPath();
            ctx2d.ellipse(s * 0.55, 0, s * 0.28, s * 0.1, 0, 0, Math.PI * 2);
            ctx2d.fill();
            const pw = s * 0.55;
            const ph = s * 0.34;
            ctx2d.fillStyle = `rgba(8, 28, 48, ${0.55 + pose.window * 0.35})`;
            ctx2d.strokeStyle = `rgba(125, 211, 252, ${0.35 + pose.window * 0.55})`;
            ctx2d.lineWidth = Math.max(1.5, s * 0.02);
            ctx2d.beginPath();
            if (typeof ctx2d.roundRect === "function") {
                ctx2d.roundRect(-pw / 2, -ph / 2, pw, ph, s * 0.03);
            } else {
                ctx2d.rect(-pw / 2, -ph / 2, pw, ph);
            }
            ctx2d.fill();
            ctx2d.stroke();
        }
        ctx2d.restore();
    }

    function frame(now) {
        if (!running) return;
        raf = requestAnimationFrame(frame);
        if (document.hidden) return;
        const menu = document.getElementById("screen-menu");
        if (menu && menu.classList.contains("hidden")) return;

        // 动效期限帧 ~30fps，闲置可满帧
        if (cineLite && now - lastDrawMs < 32) {
            tickPose(now);
            return;
        }
        lastDrawMs = now;

        tickPose(now);
        const t = (now - startMs) * 0.001;
        if (mode === "webgl" && gl && program) {
            gl.useProgram(program);
            gl.uniform1f(uTime, t);
            applyPoseUniforms();
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        } else if (mode === "canvas2d") {
            draw2d(t);
        }
    }

    function tryWebGL() {
        gl = canvas.getContext("webgl", {
            alpha: false,
            antialias: false,
            depth: false,
            powerPreference: "low-power",
        });
        if (!gl) return false;
        const vs = compile(gl.VERTEX_SHADER, VS);
        const fs = compile(gl.FRAGMENT_SHADER, FS);
        if (!vs || !fs) return false;
        program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.warn("[MenuSky]", gl.getProgramInfoLog(program));
            return false;
        }
        gl.useProgram(program);
        buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(program, "a_pos");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        uTime = gl.getUniformLocation(program, "u_time");
        uRes = gl.getUniformLocation(program, "u_res");
        uPose = gl.getUniformLocation(program, "u_pose");
        mode = "webgl";
        applyPoseUniforms();
        return true;
    }

    function tryCanvas2d() {
        ctx2d = canvas.getContext("2d");
        if (!ctx2d) return false;
        mode = "canvas2d";
        return true;
    }

    function mount(targetCanvas) {
        canvas = targetCanvas || document.getElementById("menu-sky-canvas");
        if (!canvas) {
            console.warn("[MenuSky] canvas missing");
            return false;
        }
        if (mode !== "none") return true;

        if (!tryWebGL()) {
            gl = null;
            program = null;
            if (!tryCanvas2d()) {
                console.warn("[MenuSky] no renderer");
                canvas.classList.add("menu-sky-fallback");
                return false;
            }
            console.info("[MenuSky] using Canvas2D fallback");
        } else {
            console.info("[MenuSky] WebGL ready");
        }

        if (!visibilityBound) {
            document.addEventListener("visibilitychange", () => {
                if (!document.hidden && running) resize();
            });
            visibilityBound = true;
        }
        if (typeof ResizeObserver !== "undefined") {
            resizeObs = new ResizeObserver(() => resize());
            resizeObs.observe(document.documentElement);
        }
        window.addEventListener("resize", resize);
        window.addEventListener("orientationchange", () => {
            setTimeout(resize, 80);
            setTimeout(resize, 320);
        });
        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", resize);
            window.visualViewport.addEventListener("scroll", resize);
        }
        resize();
        return true;
    }

    function start() {
        if (!mount()) return;
        if (running) {
            resize();
            return;
        }
        running = true;
        startMs = performance.now();
        resize();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
        frame(startMs);
    }

    function stop() {
        running = false;
        cancelAnimationFrame(raf);
        raf = 0;
        poseAnim = null;
    }

    /** 预设：关卡选择 — 轻推近（重戏交给 DOM 舱门） */
    function approachLevels() {
        return animatePose(
            { zoom: isMobile() ? 1.35 : 1.45, yaw: -0.2, face: 0.55, window: 0.7 },
            { duration: 520 }
        );
    }

    function approachArchive() {
        return animatePose(
            { zoom: isMobile() ? 1.28 : 1.38, yaw: 0.18, face: 0.45, window: 0.6 },
            { duration: 480 }
        );
    }

    function approachTalent() {
        return animatePose(
            { zoom: isMobile() ? 1.32 : 1.42, yaw: -0.12, face: 0.5, window: 0.65 },
            { duration: 500 }
        );
    }

    return {
        mount,
        start,
        stop,
        resize,
        animatePose,
        setPose,
        getPose,
        resetPose,
        setCinematicLite,
        approachLevels,
        approachArchive,
        approachTalent,
    };
})();
