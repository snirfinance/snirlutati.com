/* סקריפט משותף לכל האתר. נטען פעם אחת בכל דף, אחרי angles.js
   תפריט מובייל · זווית (sessionStorage) · קישורי וואטסאפ · באנר עוגיות + פיקסל מטא · טופס Netlify */
(function(){
  "use strict";

  /* ---- הגדרות ---- */
  var PIXEL_ID = "PIXEL_ID";          /* שניר משלים. עד אז הפיקסל לא נטען בכלל */
  var CONSENT_KEY = "snl_consent_v2"; /* מפתח חדש (לא snl_ck_v1), כדי שכולם יראו את הבאנר החדש */
  var WA_NUMBER = "972502440626";
  var ANGLES = window.ANGLES || {};

  function store(kind){ try{ return window[kind]; }catch(e){ return null; } }
  function get(kind,k){ try{ var s=store(kind); return s ? s.getItem(k) : null; }catch(e){ return null; } }
  function set(kind,k,v){ try{ var s=store(kind); if(s) s.setItem(k,v); }catch(e){} }
  function has(o,k){ return Object.prototype.hasOwnProperty.call(o,k); }

  /* ---- זווית: מ-?angle= נשמרת ב-sessionStorage לכל הביקור ---- */
  var qs; try{ qs = new URLSearchParams(location.search); }catch(e){ qs = null; }
  var qAngle = qs ? qs.get("angle") : null;
  var qUtm = qs ? qs.get("utm_campaign") : null;
  if(qAngle){
    set("sessionStorage","snl_angle",qAngle);
    set("sessionStorage","snl_utm",qUtm || "");
  } else if(qUtm){
    set("sessionStorage","snl_utm",qUtm);
  }
  var angle = qAngle || get("sessionStorage","snl_angle") || "";
  var utm = (qAngle ? (qUtm || "") : (qUtm || get("sessionStorage","snl_utm") || ""));
  var known = angle && angle !== "default" && has(ANGLES,angle);
  var angleLabel = known ? angle : (angle ? angle : "default");
  var waCode = known && ANGLES[angle].waCode ? ANGLES[angle].waCode : "W0";
  window.SNL = { angle: known ? angle : null, angleLabel: angleLabel, utm: utm, waCode: waCode };

  /* ---- תפריט מובייל: מחובר פעם אחת ---- */
  var burger = document.getElementById("burger"), mnav = document.getElementById("mnav");
  if(burger && mnav && !burger.getAttribute("data-bound")){
    burger.setAttribute("data-bound","1");
    burger.addEventListener("click",function(){
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", open ? "false" : "true");
      mnav.classList.toggle("show", !open);
    });
    mnav.addEventListener("click",function(e){
      if(e.target && e.target.tagName === "A"){ burger.setAttribute("aria-expanded","false"); mnav.classList.remove("show"); }
    });
  }

  /* ---- הסכמה לעוגיות ופיקסל (מודל א) ---- */
  function consent(){ return get("localStorage",CONSENT_KEY); }
  function pixelReady(){ return /^\d{6,}$/.test(PIXEL_ID); }
  var pixelLoaded = false;
  function loadPixel(){
    if(pixelLoaded || !pixelReady() || consent() !== "granted") return;
    pixelLoaded = true;
    /* קוד הבסיס של Meta. בלי Advanced Matching: init בלי נתוני משתמש */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,"script","https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("consent","grant");
    window.fbq("set","autoConfig",false,PIXEL_ID);
    window.fbq("init",PIXEL_ID);
    window.fbq("track","PageView");
  }
  function track(ev){
    if(consent() !== "granted" || !pixelLoaded || typeof window.fbq !== "function") return;
    try{ window.fbq("track",ev,{angle:angleLabel}); }catch(e){}
  }
  window.SNL.track = track;

  var ck = null;
  function buildBanner(){
    if(ck) return ck;
    ck = document.createElement("div");
    ck.className = "ck"; ck.id = "ck"; ck.hidden = true;
    ck.setAttribute("role","region"); ck.setAttribute("aria-label","הגדרות עוגיות");
    ck.innerHTML = '<div class="ck-in"><p>האתר משתמש בעוגייה חיונית, ובאישורך גם בפיקסל של מטא, כדי לדעת אילו מודעות מביאות פניות <a href="/privacy/">מדיניות הפרטיות</a></p>'+
      '<div class="ck-btns"><button type="button" class="ck-yes">מאשר</button><button type="button" class="ck-no">רק חיוניות</button></div></div>';
    document.body.appendChild(ck);
    ck.querySelector(".ck-yes").addEventListener("click",function(){ choose("granted"); });
    ck.querySelector(".ck-no").addEventListener("click",function(){ choose("essential"); });
    return ck;
  }
  function showBanner(focus){
    buildBanner().hidden = false; document.body.classList.add("ck-visible");
    if(focus){ ck.querySelector(".ck-yes").focus(); }
  }
  function hideBanner(){ if(ck){ ck.hidden = true; } document.body.classList.remove("ck-visible"); }
  function clearMetaCookies(){
    try{
      var host = location.hostname, parts = host.split("."), doms = ["", host];
      if(parts.length > 1) doms.push("." + parts.slice(-2).join("."));
      ["_fbp","_fbc"].forEach(function(n){
        doms.forEach(function(d){ document.cookie = n + "=; Max-Age=0; path=/" + (d ? "; domain=" + d : ""); });
      });
    }catch(e){}
  }
  function choose(v){
    set("localStorage",CONSENT_KEY,v);
    hideBanner();
    if(v === "granted"){ loadPixel(); }
    else {
      if(typeof window.fbq === "function"){ try{ window.fbq("consent","revoke"); }catch(e){} }
      clearMetaCookies();
    }
  }
  var c = consent();
  if(c === "granted"){ loadPixel(); }
  else if(c !== "essential"){ showBanner(false); }
  document.addEventListener("click",function(e){
    var t = e.target && e.target.closest ? e.target.closest("[data-ck-open]") : null;
    if(t){ e.preventDefault(); showBanner(true); }
  });

  /* ---- וואטסאפ: טקסט מוכן לפי דף + קוד זווית, ואירוע Contact ---- */
  var pageText = document.body.getAttribute("data-wa") || "היי שניר, הגעתי מהאתר ואשמח לבדיקה";
  var waLinks = document.querySelectorAll('a[href^="https://wa.me/"]');
  for(var i=0;i<waLinks.length;i++){
    (function(a){
      var text = (a.getAttribute("data-wa-text") || pageText) + " (" + waCode + ")";
      a.href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
      a.addEventListener("click",function(){ track("Contact"); });
    })(waLinks[i]);
  }

  /* ---- דף נחיתה: תוכן לפי זווית ---- */
  if(document.body.getAttribute("data-page") === "lp" && known){
    var A = ANGLES[angle];
    var byId = function(id){ return document.getElementById(id); };
    if(byId("h1")) byId("h1").textContent = A.h1;
    if(byId("sub")) byId("sub").textContent = A.sub;
    if(byId("slipTitle")) byId("slipTitle").textContent = A.slipTitle;
    ["k1","v1","k2","v2"].forEach(function(id,ix){ if(byId(id) && A.slip) byId(id).textContent = A.slip[ix]; });
    if(byId("note")) byId("note").textContent = A.note;
  }

  /* ---- טופס Netlify ---- */
  var forms = document.querySelectorAll("form.lead-form");
  for(var j=0;j<forms.length;j++){
    (function(f){
      var af = f.querySelector('input[name="angle"]'), uf = f.querySelector('input[name="utm_campaign"]');
      if(af) af.value = angleLabel;
      if(uf) uf.value = utm;
      var topic = f.querySelector('select[name="topic"]');
      if(topic && known && typeof ANGLES[angle].topic === "number" && document.body.getAttribute("data-page") === "lp"){
        topic.selectedIndex = ANGLES[angle].topic;
      }
      var s = f.querySelector(".status");
      var busy = false;
      f.addEventListener("submit",function(e){
        e.preventDefault();
        if(busy) return;
        if(typeof f.reportValidity === "function" && !f.reportValidity()) return;
        busy = true;
        if(s) s.textContent = "שולח...";
        var body;
        try{ body = new URLSearchParams(new FormData(f)).toString(); }
        catch(err){ busy = false; f.submit(); return; }
        fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:body})
          .then(function(r){
            busy = false;
            if(r.ok){
              if(s) s.textContent = "קיבלתי, אחזור אליך עד יום עסקים";
              f.reset();
              if(af) af.value = angleLabel;
              if(uf) uf.value = utm;
              track("Lead");
            } else if(s){ s.textContent = "השליחה לא עברה\nנסה שוב או שלח לי וואטסאפ"; }
          })
          .catch(function(){
            busy = false;
            if(s) s.textContent = "אין חיבור כרגע\nנסה שוב או שלח לי וואטסאפ";
          });
      });
    })(forms[j]);
  }
})();
