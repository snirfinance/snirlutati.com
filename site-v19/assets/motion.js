/* אנימציות עם GSAP + ScrollTrigger. נטען אחרי site.js (כדי שטקסט הזווית כבר בדף)
   בלי GSAP או עם prefers-reduced-motion – הדף נשאר סטטי ומלא, כלום לא מוסתר
   ה-h1 לא מונפש בכוונה: הוא אלמנט ה-LCP */
(function(){
  "use strict";
  var gsap = window.gsap, ST = window.ScrollTrigger;
  if(!gsap || !ST) return;
  gsap.registerPlugin(ST);

  /* ---- גלילה חלקה עם Lenis. רק בעכבר/טאצ'פד; בנייד הגלילה נשארת של המכשיר
     עם prefers-reduced-motion לא מפעילים בכלל ---- */
  if(window.Lenis && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    var lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    window.lenis = lenis;
    lenis.on("scroll", ST.update);
    gsap.ticker.add(function(time){ lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    /* קישורי עוגן (#contact וכו') גולשים חלק, מתחת לכותרת הדביקה. קישור הדילוג נשאר רגיל בשביל הנגישות */
    document.addEventListener("click", function(e){
      var a = e.target.closest && e.target.closest('a[href^="#"]:not(.skip)');
      if(!a) return;
      var id = a.getAttribute("href");
      var target = id.length > 1 && document.querySelector(id);
      if(!target) return;
      e.preventDefault();
      var header = document.querySelector(".site-header");
      lenis.scrollTo(target, { offset: -((header && header.offsetHeight) || 0) - 12 });
      history.pushState(null, "", id);
    });
  }

  /* מספר ראשון בטקסט, עם הטקסט שסביבו: "1,200 ₪ בשנה" → {pre:"", n:1200, post:" ₪ בשנה"} */
  function parse(el){
    var t = el ? el.textContent : "";
    var m = t.match(/\d[\d,]*/);
    if(!m) return null;
    return { pre: t.slice(0, m.index), n: parseInt(m[0].replace(/,/g,""), 10), post: t.slice(m.index + m[0].length), text: t };
  }
  function fmt(n){ return Math.round(n).toLocaleString("en-US"); }

  /* ספירה של אלמנט מ-from עד הערך שלו (או עד parsed, אם הטקסט כבר הוחלף). מחזיר tween (או null) */
  function countTo(el, from, opts, parsed){
    var p = parsed || parse(el);
    if(!p) return null;
    var o = { v: from };
    return gsap.to(o, Object.assign({
      v: p.n, duration: 1.2, ease: "power2.out",
      onUpdate: function(){ el.textContent = p.pre + fmt(o.v) + p.post; },
      onComplete: function(){ el.textContent = p.text; }
    }, opts || {}));
  }

  var mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", function(){

    /* ---- התלוש ב-hero: השורות נכנסות, והמספר השני "יורד" מהשכר המלא לשכר שמופקד ---- */
    var slip = document.querySelector(".hero .slip");
    if(slip){
      var v1 = document.getElementById("v1"), v2 = document.getElementById("v2");
      var p1 = parse(v1), p2 = parse(v2);
      /* בדסקטופ התלוש גלוי מיד ורץ בטעינה. בנייד הוא מתחת לקיפול, אז מחכים שיגיע למסך */
      var tl = gsap.timeline({ delay: 0.25, scrollTrigger: { trigger: slip, start: "top 90%", once: true } });
      tl.from(slip, { y: 16, opacity: 0, duration: 0.6, ease: "power2.out" })
        .from(slip.querySelectorAll(".slip-row, .slip-note"), { y: 10, opacity: 0, duration: 0.45, stagger: 0.15, ease: "power2.out" }, "-=0.25");
      /* יורד מ-v1 כשזה אותה יחידה וגדול יותר (28,000 → 13,000), אחרת עולה מאפס */
      var start = (p1 && p2 && p1.n > p2.n && p1.post === p2.post) ? p1.n : 0;
      var c = countTo(v2, start, { duration: 1.4 });
      if(c) tl.add(c, "-=0.5");
      tl.fromTo(slip.querySelector(".slip-row.gap"),
        { backgroundColor: "rgba(201,180,138,0)" },
        { backgroundColor: "rgba(201,180,138,0.22)", duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, "-=0.3");
    }

    /* ---- סקשנים: כניסה עדינה בגלילה. רשימות וכרטיסים נכנסים אחד אחרי השני ---- */
    var groups = ".checks > div, .reviews > .review, .flow > li, .facts > li, .faq > details, .plain-list > li";
    document.querySelectorAll("main section .wrap").forEach(function(wrap){
      var items = [];
      wrap.querySelectorAll(":scope > *, :scope > .lines > *").forEach(function(el){
        if(el.classList.contains("lines")) return;
        if(el.matches(".checks, .reviews, .flow, .facts, .faq, .plain-list")){
          items.push.apply(items, el.querySelectorAll(groups));
        } else items.push(el);
      });
      if(!items.length) return;
      gsap.from(items, {
        y: 24, opacity: 0, duration: 0.7, ease: "power2.out", stagger: 0.08,
        scrollTrigger: { trigger: wrap, start: "top 85%", once: true }
      });
    });

    /* ---- "זהו?": התחזית עולה מ-12,000 ל-17,000 כשמגיעים אליה ---- */
    document.querySelectorAll("[data-count-from]").forEach(function(el){
      var from = parseInt(el.getAttribute("data-count-from"), 10) || 0;
      var p = parse(el);
      if(!p) return;
      el.textContent = p.pre + fmt(from) + p.post; /* עדיין מחוץ למסך, אז לא רואים את ההחלפה */
      countTo(el, from, { duration: 1.6, delay: 0.4,
        scrollTrigger: { trigger: el, start: "top 80%", once: true } }, p);
    });
  });

  /* תמונות שנטענות מאוחר משנות גובה – מעדכנים את נקודות הטריגר */
  window.addEventListener("load", function(){ ST.refresh(); });
})();
