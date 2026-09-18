(function(){
  'use strict';

  var $=function(s,c){return (c||document).querySelector(s)};
  var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer=window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var body=document.body;
  var loader=$('#loader');
  var status=$('#loaderStatus');
  var code=$('#loaderCode');
  var time=$('#loaderTime');
  var menu=$('#mobileMenu');
  var menuButton=$('#menuButton');
  var menuClose=$('#mobileClose');
  var activePanel=null;
  var focusRoot=null;
  var lastFocus=null;

  function focusables(root){
    if(!root)return[];
    return $$('a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',root).filter(function(el){return el.offsetParent!==null});
  }

  function setLive(){
    body.classList.add('is-live');
    if(loader)loader.classList.add('is-done');
  }

  function boot(){
    if(!loader||reduced){setLive();return}
    var stages=[
      {t:120,status:'SEARCHING FOR FREQUENCY',code:'NO SIGNAL',time:'00:00:01'},
      {t:560,status:'SCANNING / 88.1 — 94.7',code:'CH / 09',time:'00:00:02'},
      {t:1080,status:'LOCKING SIGNAL',code:'SODO / RX',time:'00:00:02'},
      {t:1530,status:'SIGNAL FOUND',code:'ONLINE',time:'00:00:03'}
    ];
    stages.forEach(function(stage){setTimeout(function(){status.textContent=stage.status;code.textContent=stage.code;time.textContent=stage.time},stage.t)});
    setTimeout(function(){body.classList.add('is-switching')},1580);
    setTimeout(function(){setLive();body.classList.remove('is-switching')},2050);
  }

  function signalTransition(callback){
    if(reduced){callback();return}
    body.classList.remove('is-switching');
    void body.offsetWidth;
    body.classList.add('is-switching');
    setTimeout(callback,145);
    setTimeout(function(){body.classList.remove('is-switching')},410);
  }

  function closeMenu(restore){
    if(!menu)return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden','true');
    if(menuButton)menuButton.setAttribute('aria-expanded','false');
    if(!activePanel)focusRoot=null;
    if(restore!==false&&lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true});
  }

  function openMenu(){
    if(!menu)return;
    lastFocus=document.activeElement;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden','false');
    if(menuButton)menuButton.setAttribute('aria-expanded','true');
    focusRoot=menu;
    var first=focusables(menu)[0];
    if(first)first.focus({preventScroll:true});
  }

  function openPanel(name,trigger){
    var panel=$('[data-panel="'+name+'"]');
    if(!panel)return;
    lastFocus=(trigger&&trigger.closest&&trigger.closest('.mobile-menu'))?menuButton:(trigger||document.activeElement);
    if(menu&&menu.classList.contains('is-open'))closeMenu(false);
    signalTransition(function(){
      if(activePanel&&activePanel!==panel){activePanel.classList.remove('is-open');activePanel.setAttribute('aria-hidden','true')}
      activePanel=panel;
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden','false');
      focusRoot=panel;
      var first=focusables(panel)[0];
      if(first)first.focus({preventScroll:true});
    });
  }

  function closePanel(){
    if(!activePanel)return;
    var panel=activePanel;
    signalTransition(function(){
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden','true');
      activePanel=null;
      focusRoot=null;
      if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true});
    });
  }

  function trapFocus(e){
    if(e.key!=='Tab'||!focusRoot)return;
    var items=focusables(focusRoot);
    if(!items.length)return;
    var first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }

  $$('[data-open]').forEach(function(btn){btn.addEventListener('click',function(){openPanel(btn.getAttribute('data-open'),btn)})});
  $$('[data-close]').forEach(function(btn){btn.addEventListener('click',closePanel)});
  if(menuButton)menuButton.addEventListener('click',openMenu);
  if(menuClose)menuClose.addEventListener('click',function(){closeMenu(true)});

  document.addEventListener('keydown',function(e){
    trapFocus(e);
    if(e.key!=='Escape')return;
    if(activePanel)closePanel();
    else if(menu&&menu.classList.contains('is-open'))closeMenu(true);
  });

  var brand=$('#brandHome');
  if(brand)brand.addEventListener('click',function(e){e.preventDefault();if(activePanel)closePanel();else if(menu&&menu.classList.contains('is-open'))closeMenu(true)});

  function setupPointer(){
    if(!finePointer||reduced)return;
    window.addEventListener('pointermove',function(e){
      var x=(e.clientX/window.innerWidth-.5)*2;
      var y=(e.clientY/window.innerHeight-.5)*2;
      document.documentElement.style.setProperty('--mouse-x',x.toFixed(3));
      document.documentElement.style.setProperty('--mouse-y',y.toFixed(3));
    },{passive:true});
  }

  function setupAmbientSignal(){
    if(reduced)return;
    var screen=$('#crtScreen');
    if(!screen||!screen.animate)return;
    function tick(){
      var delay=4400+Math.random()*5200;
      setTimeout(function(){
        screen.animate([
          {transform:'perspective(760px) rotateY(1.2deg) rotateZ(-.15deg) translateX(0)',filter:'brightness(1)'},
          {transform:'perspective(760px) rotateY(1.2deg) rotateZ(-.15deg) translateX(-5px)',filter:'brightness(1.65) contrast(1.32)'},
          {transform:'perspective(760px) rotateY(1.2deg) rotateZ(-.15deg) translateX(3px)',filter:'brightness(.76)'},
          {transform:'perspective(760px) rotateY(1.2deg) rotateZ(-.15deg) translateX(0)',filter:'brightness(1)'}
        ],{duration:170,easing:'steps(3,end)'});
        tick();
      },delay);
    }
    tick();
  }

  function setupServices(){
    var preview=$('#servicePreview');
    var title=$('#servicePreviewTitle');
    var note=$('#servicePreviewNote');
    if(!preview||!title||!note)return;
    $$('.service-row').forEach(function(row,index){
      function activate(){
        $$('.service-row').forEach(function(item){item.classList.toggle('is-active',item===row)});
        preview.dataset.mode=row.getAttribute('data-service')||'';
        title.textContent=row.getAttribute('data-title')||'';
        note.textContent=row.getAttribute('data-note')||'';
        var idx=$('.service-preview__index');
        if(idx)idx.textContent='ACTIVE SIGNAL / '+String(index+1).padStart(2,'0');
        if(!reduced){preview.classList.remove('is-glitching');void preview.offsetWidth;preview.classList.add('is-glitching')}
      }
      row.addEventListener('mouseenter',activate);
      row.addEventListener('focus',activate);
      row.addEventListener('click',activate);
    });
  }

  function setupForm(){
    var form=$('#leadForm');
    var formStatus=$('#formStatus');
    if(!form||!formStatus)return;
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var data=new FormData(form);
      var name=String(data.get('name')||'').trim();
      var contact=String(data.get('contact')||'').trim();
      var message=String(data.get('message')||'').trim();
      if(!name||!contact||!message){formStatus.textContent='Заповніть усі три поля';return}
      var subject=encodeURIComponent('SODO — новий запит від '+name);
      var text=encodeURIComponent('Імʼя: '+name+'\nКонтакт: '+contact+'\n\nЗадача:\n'+message);
      formStatus.textContent='Відкриваємо пошту — повідомлення вже підготовлено';
      window.location.href='mailto:hello@sodo.agency?subject='+subject+'&body='+text;
    });
  }

  boot();
  setupPointer();
  setupAmbientSignal();
  setupServices();
  setupForm();
})();