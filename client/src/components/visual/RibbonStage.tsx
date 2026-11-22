import React, { useEffect, useRef } from 'react';
import { HeartHandshake, Zap } from 'lucide-react';

// Three.js is loaded once from the same CDN approach used by the supplied reference.
declare global { interface Window { THREE?: any } }

export const RibbonStage: React.FC = () => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let renderer: any;
    let frame = 0;
    let resizeObserver: ResizeObserver | undefined;
    let removePointer = () => {};
    let removeScroll = () => {};
    let scene: any, camera: any, ribbon: any, slats: any;
    const host = hostRef.current;
    if (!host) return;

    const init = () => {
      if (cancelled || !host || !window.THREE) return;
      const THREE = window.THREE;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      camera.position.set(0, 0.12, 8.8);
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.setClearColor(0x000000, 0);
      if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
      else renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.domElement.className = 'ks-three-ribbon-canvas';
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.prepend(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd2cf, 1.1));
      const key = new THREE.DirectionalLight(0xffffff, 1.15);
      key.position.set(3, 5, 7); scene.add(key);
      const pink = new THREE.DirectionalLight(0xe6a0c4, 0.55);
      pink.position.set(-5, -2, 4); scene.add(pink);
      const blue = new THREE.DirectionalLight(0xb5c9ed, 0.45);
      blue.position.set(5, 1, -4); scene.add(blue);

      ribbon = new THREE.Group(); scene.add(ribbon);
      const count = 144;
      const geometry = new THREE.BoxGeometry(0.052, 1.52, 0.34, 1, 1, 1);
      const material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.27, metalness: 0.12, clearcoat: 0.82, clearcoatRoughness: 0.2 });
      slats = new THREE.InstancedMesh(geometry, material, count);
      slats.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const palette = ['#d9789f','#e8a0b6','#bd83bd','#8e91c8','#7cadd0','#9bc9c1'].map(c => new THREE.Color(c));
      const color = new THREE.Color();
      for (let i=0;i<count;i++) {
        const t=i/(count-1)*(palette.length-1), idx=Math.floor(t);
        color.copy(palette[idx]).lerp(palette[Math.min(idx+1,palette.length-1)],t-idx);
        slats.setColorAt(i,color);
      }
      ribbon.add(slats);
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(10.8,2.8),new THREE.MeshBasicMaterial({color:0x53616d,transparent:true,opacity:.08,depthWrite:false}));
      shadow.rotation.x=-Math.PI/2; shadow.position.set(0,-1.4,-.15); ribbon.add(shadow);

      const pointer={x:0,y:0,sx:0,sy:0,pulse:0};
      const onPointer=(e:PointerEvent)=>{const r=host.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width-.5)*2;pointer.y=-((e.clientY-r.top)/r.height-.5)*2;};
      const onLeave=()=>{pointer.x=0;pointer.y=0;};
      const onDown=()=>{pointer.pulse=1;};
      host.addEventListener('pointermove',onPointer,{passive:true});
      host.addEventListener('pointerleave',onLeave);
      host.addEventListener('pointerdown',onDown);
      removePointer=()=>{host.removeEventListener('pointermove',onPointer);host.removeEventListener('pointerleave',onLeave);host.removeEventListener('pointerdown',onDown);};

      let scroll=0;
      const onScroll=()=>{const rect=host.getBoundingClientRect();scroll=Math.max(-1,Math.min(1,(window.innerHeight*.6-rect.top)/(window.innerHeight+rect.height)));};
      window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
      removeScroll=()=>window.removeEventListener('scroll',onScroll);

      const clock=new THREE.Clock();
      const dummy=new THREE.Object3D();
      const resize=()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);camera.aspect=w/h;camera.position.z=w<600?10.2:8.8;camera.updateProjectionMatrix();renderer.setSize(w,h,false);};
      resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();

      const animate=()=>{
        if(cancelled)return;
        frame=requestAnimationFrame(animate);
        const time=clock.getElapsedTime();
        pointer.sx+=(pointer.x-pointer.sx)*(reducedMotion?.025:.075);
        pointer.sy+=(pointer.y-pointer.sy)*(reducedMotion?.025:.075);
        pointer.pulse*=.92;
        const mobile=host.clientWidth<600;
        ribbon.position.y=scroll*.22;
        ribbon.rotation.set(.13+pointer.sy*.12+scroll*.08,pointer.sx*.16, pointer.sx*-.025);
        ribbon.scale.setScalar(mobile?.78:1);
        for(let i=0;i<count;i++){
          const u=i/(count-1),x=(u-.5)*10.3;
          const dist=Math.abs(u-(pointer.sx*.5+.5));
          const bump=Math.exp(-dist*dist*22)*(.22+pointer.pulse*.42);
          const wave=Math.sin(u*Math.PI*2.35-time*(reducedMotion?0:.9))*.58+Math.cos(u*Math.PI*1.2+time*(reducedMotion?0:.5))*.18+bump;
          const depth=Math.cos(u*Math.PI*2.35-time*(reducedMotion?0:.9))*.62;
          dummy.position.set(x,wave,depth);
          dummy.rotation.set(Math.sin(u*Math.PI*2.6-time*(reducedMotion?0:.9))*.78+pointer.sy*.24,Math.cos(u*Math.PI*1.8-time*.7)*.42,Math.sin(u*Math.PI*2-time*.8)*.13);
          dummy.scale.set(1,.88+.22*Math.sin(u*Math.PI)+bump*.32,1);
          dummy.updateMatrix();slats.setMatrixAt(i,dummy.matrix);
        }
        slats.instanceMatrix.needsUpdate=true;
        renderer.render(scene,camera);
      };
      animate();
    };

    const existing=window.THREE;
    if(existing)init();
    else {
      const script=document.querySelector<HTMLScriptElement>('script[data-kaamsetu-three]');
      if(script){script.addEventListener('load',init);script.addEventListener('error',()=>{if(host)host.classList.add('ks-ribbon-fallback');});}
      else {
        const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';s.async=true;s.dataset.kaamsetuThree='true';s.onload=init;s.onerror=()=>host.classList.add('ks-ribbon-fallback');document.head.appendChild(s);
      }
    }
    return ()=>{cancelled=true;cancelAnimationFrame(frame);resizeObserver?.disconnect();removePointer();removeScroll();if(renderer){renderer.dispose();renderer.domElement.remove();} };
  }, []);

  return <div ref={hostRef} className="ks-interactive-stage" aria-label="Interactive 3D ribbon illustration">
    <div className="ks-ribbon-glow" />
    <div className="ks-ribbon-orbit ks-ribbon-orbit-a" />
    <div className="ks-ribbon-orbit ks-ribbon-orbit-b" />
    <div className="ks-ribbon-caption"><span>MOVE YOUR CURSOR</span><span>KAAMSETU / LOCAL CONNECTIONS</span></div>
    <div className="ks-ribbon-card ks-ribbon-card-top"><span className="ks-ribbon-card-icon"><Zap size={16}/></span><span><b>Work, nearby.</b><small>Opportunities around you</small></span></div>
    <div className="ks-ribbon-card ks-ribbon-card-bottom"><span className="ks-ribbon-card-icon"><HeartHandshake size={16}/></span><span><b>People, connected.</b><small>Skills meet local needs</small></span></div>
  </div>;
};
