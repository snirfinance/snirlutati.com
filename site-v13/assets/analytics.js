/* מדידה — מושבת כרגע.
   כדי להפעיל: פתחו חשבון Google Analytics 4, קבלו מזהה בצורה G-XXXXXXX,
   החליפו אותו למטה, ושנו ENABLED ל-true.
   שימו לב: מרגע ההפעלה יש לעדכן את עמוד מדיניות הפרטיות — הוא מצהיר כרגע
   שאין באתר מעקב, וזה יפסיק להיות נכון. */
var ENABLED = false;
var GA_ID = "G-XXXXXXXXXX";
if (ENABLED && GA_ID.indexOf("XXXX") === -1) {
  var s = document.createElement("script"); s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);} window.gtag = gtag;
  gtag("js", new Date()); gtag("config", GA_ID);
  document.querySelectorAll('a[href*="wa.me"]').forEach(function(a){
    a.addEventListener("click", function(){ gtag("event","whatsapp_click",{link_url:a.href}); });
  });
}
