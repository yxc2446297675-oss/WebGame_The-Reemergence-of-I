/**
 * 主菜单背景：云间飞船（优先 WebGL，失败则用 Canvas2D）
 * 首次进菜单不会调用 showMenu，因此必须在加载完成时主动 start。
 */
export const MenuSkyShader = (() => {
    let canvas = null;
    let gl = null;
    let program = null;
    let buf = null;
    let uTime = null;
    let uRes = null;
    let raf = 0;
    let running = false;
    let startMs = 0;
    let mode = "none"; // webgl | canvas2d | none
    let ctx2d = null;
    let resizeObs = null;
    let visibilityBound = false;

    const VS = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

    // 高对比云海 + 大飞船剪影（刻意做显眼）
    const FS = `
precision mediump float;
uniform float u_time;
uniform vec2 u_res;

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
float shipSDF(vec2 p){
  float hull = sdCapsule(p, vec2(-.34,.0), vec2(.42,.02), .07);
  float bridge = sdEllipse(p-vec2(.06,.09), vec2(.14,.055));
  float finT = sdCapsule(p, vec2(-.28,.03), vec2(-.48,.18), .02);
  float finB = sdCapsule(p, vec2(-.28,-.03), vec2(-.46,-.16), .02);
  float nose = sdEllipse(p-vec2(.46,.02), vec2(.11,.04));
  float eng = sdEllipse(p-vec2(-.40,.0), vec2(.08,.06));
  return min(hull, min(bridge, min(finT, min(finB, min(nose, eng)))));
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  float aspect = u_res.x / max(u_res.y, 1.);
  vec2 p = uv*2.-1.;
  p.x *= aspect;
  float t = u_time;

  // 鲜艳暮色天空
  vec3 c0 = vec3(0.05, 0.07, 0.18);
  vec3 c1 = vec3(0.18, 0.28, 0.55);
  vec3 c2 = vec3(0.95, 0.45, 0.22);
  vec3 c3 = vec3(1.0, 0.72, 0.35);
  vec3 sky = mix(c3, c2, smoothstep(0.0, 0.32, uv.y));
  sky = mix(sky, c1, smoothstep(0.25, 0.62, uv.y));
  sky = mix(sky, c0, smoothstep(0.55, 1.0, uv.y));

  // 星
  vec2 sp = uv * vec2(70.*aspect, 70.);
  float sn = hash(floor(sp));
  if (sn > 0.97 && uv.y > 0.42) {
    sky += (0.5+0.5*sin(t*3.+sn*50.)) * smoothstep(0.97,1.,sn) * vec3(0.8,0.9,1.2);
  }

  // 厚云（更亮、更实）
  float drift = t * 0.08;
  float cloud = fbm(vec2(uv.x*2.6*aspect + drift, uv.y*1.8));
  cloud += 0.45 * fbm(vec2(uv.x*4.2*aspect - drift*0.6, uv.y*2.8 + 3.));
  cloud = smoothstep(0.42, 0.78, cloud);
  float band = smoothstep(0.02, 0.28, uv.y) * (1. - smoothstep(0.48, 0.88, uv.y));
  cloud *= band;
  vec3 cloudCol = mix(vec3(0.55,0.35,0.4), vec3(1.0,0.88,0.75), cloud);
  sky = mix(sky, cloudCol, cloud * 0.92);

  // 地平线强光
  sky += exp(-abs(uv.y-0.24)*10.) * vec3(1.0, 0.55, 0.2) * 0.55;

  // 大飞船（更靠中、更大）
  float shipX = sin(t*0.25)*0.18;
  float shipY = 0.02 + sin(t*0.35)*0.04;
  vec2 su = p - vec2(shipX, shipY);
  su *= 0.95;
  float sd = shipSDF(su);
  float ship = 1. - smoothstep(0., 0.018, sd);
  float soft = 1. - smoothstep(0., 0.07, sd);

  // 引擎焰
  vec2 ep = su - vec2(-0.52, 0.0);
  float ex = exp(-dot(ep*vec2(1.6,5.5), ep*vec2(1.6,5.5)));
  ex *= 0.65 + 0.35*sin(t*22. + ep.x*30.);
  sky += ex * vec3(0.3, 0.85, 1.2) * 0.95;
  sky += ex * vec3(1.0, 0.5, 0.15) * 0.45;

  sky = mix(sky, vec3(0.02,0.03,0.06), ship);
  // 舷窗
  float win = 1. - smoothstep(0., 0.01, length(su-vec2(0.08,0.08))-0.018);
  sky += win * ship * vec3(0.45, 0.95, 1.2) * 1.2;
  sky = mix(sky, sky*0.9, soft*0.2*(1.-ship));

  // 轻暗角（别压没）
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

    function resize() {
        if (!canvas) return;
        // fixed 全屏：以视口为准，避免被半透明弹窗盖住后尺寸算错
        const w = Math.max(2, window.innerWidth || document.documentElement.clientWidth || 2);
        const h = Math.max(2, window.innerHeight || document.documentElement.clientHeight || 2);
        const scale = isMobile() ? 0.55 : 0.75;
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

        // 云团
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

        // 飞船剪影
        const sx = w * (0.5 + Math.sin(t * 0.35) * 0.12);
        const sy = h * (0.48 + Math.sin(t * 0.45) * 0.03);
        const s = Math.min(w, h) * 0.22;
        ctx2d.save();
        ctx2d.translate(sx, sy);
        // 引擎
        const flame = ctx2d.createRadialGradient(-s * 0.55, 0, 0, -s * 0.55, 0, s * 0.45);
        flame.addColorStop(0, "rgba(180,240,255,0.95)");
        flame.addColorStop(0.4, "rgba(80,180,255,0.55)");
        flame.addColorStop(1, "rgba(40,100,255,0)");
        ctx2d.fillStyle = flame;
        ctx2d.beginPath();
        ctx2d.ellipse(-s * 0.55, 0, s * (0.35 + 0.08 * Math.sin(t * 20)), s * 0.12, 0, 0, Math.PI * 2);
        ctx2d.fill();
        ctx2d.fillStyle = "#05070e";
        ctx2d.beginPath();
        ctx2d.moveTo(-s * 0.45, 0);
        ctx2d.quadraticCurveTo(-s * 0.2, -s * 0.12, s * 0.15, -s * 0.08);
        ctx2d.quadraticCurveTo(s * 0.45, -s * 0.02, s * 0.55, 0.02 * s);
        ctx2d.quadraticCurveTo(s * 0.4, s * 0.08, s * 0.05, s * 0.07);
        ctx2d.quadraticCurveTo(-s * 0.25, s * 0.1, -s * 0.45, 0);
        ctx2d.fill();
        // 翼
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
        // 窗
        ctx2d.fillStyle = "#7cf0ff";
        ctx2d.beginPath();
        ctx2d.arc(s * 0.12, -s * 0.04, s * 0.035, 0, Math.PI * 2);
        ctx2d.fill();
        ctx2d.restore();
    }

    function frame(now) {
        if (!running) return;
        raf = requestAnimationFrame(frame);
        if (document.hidden) return;
        const menu = document.getElementById("screen-menu");
        if (menu && menu.classList.contains("hidden")) return;

        const t = (now - startMs) * 0.001;
        if (mode === "webgl" && gl && program) {
            gl.useProgram(program);
            gl.uniform1f(uTime, t);
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
        mode = "webgl";
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
            resizeObs.observe(canvas.parentElement || canvas);
        } else {
            window.addEventListener("resize", resize);
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
        // 立刻画一帧，避免空白
        frame(startMs);
    }

    function stop() {
        running = false;
        cancelAnimationFrame(raf);
        raf = 0;
    }

    return { mount, start, stop, resize };
})();
