/* ============================================================
   SIDEBAR.JS — Mendezza Auto Peças
   ============================================================ */

(function () {

  /* ── LÊ SESSÃO ──
     Modo admin elevado vive APENAS no sessionStorage (morre ao fechar a aba).
     localStorage sempre reflete o estado base (usuario). */
  function getSessao() {
    try {
      var ss = sessionStorage.getItem('mnd_session');
      if (ss) return JSON.parse(ss);
      return JSON.parse(localStorage.getItem('mnd_session'));
    } catch (e) { return null; }
  }

  var ACESSO_HREF = {
    'admin':   null,
    'usuario': ['vendas.html', 'vendas.html#fiado', 'vendas.html#os']
  };

  var MENU = [
    { section: 'Principal' },
    { href: 'vendas.html',       icon: '🛒', label: 'Vendas',          tip: 'Vendas' },
    { href: 'checkin.html',      icon: '🔑', label: 'Check-in',        tip: 'Check-in' },
    { section: 'Estoque' },
    { href: 'estoque.html',      icon: '📦', label: 'Estoque',         tip: 'Estoque' },
    { section: 'Gestão' },
    { href: 'financeiro.html',   icon: '💰', label: 'Financeiro',      tip: 'Financeiro' },
    { href: 'vendas.html#fiado', icon: '💳', label: 'Fiado',           tip: 'Fiado',     badge: 'fiadoBadge' },
    { href: 'vendas.html#os',    icon: '📋', label: 'Ordens de Serv.', tip: 'Ordens OS', badge: 'osBadge' },
  ];

  /* ── CONSTRÓI O HTML DO SIDEBAR ── */
  function buildSidebar(sess) {
    var pagina     = window.location.pathname.split('/').pop() || 'index.html';
    var role       = sess ? sess.role : 'usuario';
    var permitidos = ACESSO_HREF[role];

    /* Filtra menu pelo role */
    var menuFiltrado = MENU.filter(function(item) {
      if (item.section) return true;
      if (!permitidos)  return true;
      return permitidos.indexOf(item.href) !== -1;
    });

    /* Remove seções órfãs */
    var menuFinal = [];
    for (var i = 0; i < menuFiltrado.length; i++) {
      var cur  = menuFiltrado[i];
      var prox = menuFiltrado[i + 1];
      if (cur.section) {
        if (prox && !prox.section) menuFinal.push(cur);
      } else {
        menuFinal.push(cur);
      }
    }

    var navHtml = menuFinal.map(function (item) {
      if (item.section) return '<div class="sb-section">' + item.section + '</div>';
      var base  = item.href.split('#')[0];
      var ativo = (pagina === base || (pagina === '' && base === 'index.html')) ? ' ativo' : '';
      var badge = item.badge
        ? '<span class="sb-badge" id="' + item.badge + '" style="display:none">0</span>'
        : '';
      return (
        '<a href="' + item.href + '" class="sb-item' + ativo + '" data-tip="' + item.tip + '">' +
          '<div class="sb-icon">' + item.icon + '</div>' +
          '<span class="sb-label">' + item.label + '</span>' +
          badge +
        '</a>'
      );
    }).join('');

    /* ── BOTÃO MODO ADMIN / SAIR DO MODO ADMIN ── */
    var btnAdmin = '';
    if (role === 'usuario') {
      btnAdmin =
        '<div class="sb-section" style="margin-top:4px">Acesso</div>' +
        '<div class="sb-item" onclick="sbAbrirModalAdmin()" data-tip="Modo Admin">' +
          '<div class="sb-icon" style="color:#f59e0b">🔐</div>' +
          '<span class="sb-label" style="color:#f59e0b;font-weight:700">Modo Admin</span>' +
        '</div>';
    } else if (role === 'admin' && sess && sess.user === 'admin') {
      /* Só mostra "Sair do Admin" se entrou via elevação (não é o login nativo de admin).
         Usamos a flag sess.elevado para distinguir. */
      if (sess.elevado) {
        btnAdmin =
          '<div class="sb-section" style="margin-top:4px">Acesso</div>' +
          '<div class="sb-item" onclick="sbSairModoAdmin()" data-tip="Sair do Admin" ' +
            'style="margin-bottom:4px">' +
            '<div class="sb-icon" style="color:#ef4444">🔓</div>' +
            '<span class="sb-label" style="color:#ef4444;font-weight:700">Sair do Admin</span>' +
          '</div>';
      }
    }

    var nomeUsuario  = sess ? sess.nome  : 'Usuário';
    var cargoUsuario = sess ? sess.cargo : '';
    var inicialAvatar = nomeUsuario.charAt(0).toUpperCase();

    var html =
      '<div class="sb-toggle" id="sb-toggle" title="Recolher menu">' +
        '<svg viewBox="0 0 10 10"><path d="M7 1L3 5l4 4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</div>' +
      '<a href="vendas.html" class="sb-logo">' +
        '<div class="sb-logo-icon">M</div>' +
        '<div class="sb-logo-txt"><span>Mendezza</span><span>Auto Peças</span></div>' +
      '</a>' +
      '<nav class="sb-nav">' + navHtml + btnAdmin + '</nav>' +
      '<div class="sb-user">' +
        '<div class="sb-user-avatar" style="cursor:default">' + inicialAvatar + '</div>' +
        '<div class="sb-user-info">' +
          '<span>' + nomeUsuario + '</span>' +
          '<span>' + cargoUsuario + '</span>' +
        '</div>' +
        '<button onclick="mndLogout()" title="Sair" ' +
          'style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,.4);' +
          'font-size:.85rem;padding:4px 6px;border-radius:6px;transition:.15s;flex-shrink:0;margin-left:auto" ' +
          'onmouseover="this.style.color=\'#fff\';this.style.background=\'rgba(255,255,255,.1)\'" ' +
          'onmouseout="this.style.color=\'rgba(255,255,255,.4)\';this.style.background=\'none\'">⏏</button>' +
      '</div>';

    return html;
  }

  /* ── MODAL MODO ADMIN ── */
  function criarModalAdmin() {
    if (document.getElementById('sb-modal-admin')) return;

    var el = document.createElement('div');
    el.id = 'sb-modal-admin';
    el.innerHTML =
      '<div id="sb-modal-admin-box">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">' +
          '<div style="width:42px;height:42px;background:#f59e0b;border-radius:10px;' +
            'display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0">🔐</div>' +
          '<div>' +
            '<div style="font-size:1rem;font-weight:800;color:#1e293b">Modo Administrador</div>' +
            '<div style="font-size:.78rem;color:#64748b;margin-top:1px">Digite a senha de admin para continuar</div>' +
          '</div>' +
        '</div>' +
        '<div id="sb-admin-erro" style="display:none;background:#fef2f2;border:1px solid #fecaca;' +
          'border-radius:7px;padding:9px 13px;font-size:.83rem;color:#ef4444;margin-bottom:14px">' +
          '⚠️ Senha incorreta. Tente novamente.' +
        '</div>' +
        '<div style="position:relative;margin-bottom:16px">' +
          '<span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);opacity:.45">🔒</span>' +
          '<input id="sb-admin-inp" type="password" placeholder="Senha do admin" ' +
            'style="width:100%;padding:11px 14px 11px 38px;border:1.5px solid #e2e8f0;' +
            'border-radius:9px;font-size:.92rem;outline:none;transition:.15s" ' +
            'onkeydown="if(event.key===\'Enter\')sbConfirmarAdmin()" ' +
            'onfocus="this.style.borderColor=\'#5271ff\';this.style.boxShadow=\'0 0 0 3px rgba(82,113,255,.12)\'" ' +
            'onblur="this.style.borderColor=\'#e2e8f0\';this.style.boxShadow=\'none\'">' +
        '</div>' +
        '<div style="display:flex;gap:10px">' +
          '<button onclick="sbFecharModalAdmin()" ' +
            'style="flex:1;padding:10px;border:1.5px solid #e2e8f0;background:#fff;border-radius:8px;' +
            'font-size:.88rem;font-weight:600;cursor:pointer;color:#64748b;transition:.14s" ' +
            'onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'#fff\'">Cancelar</button>' +
          '<button onclick="sbConfirmarAdmin()" ' +
            'style="flex:1;padding:10px;background:#5271ff;color:#fff;border:none;border-radius:8px;' +
            'font-size:.88rem;font-weight:700;cursor:pointer;transition:.14s;' +
            'box-shadow:0 3px 10px rgba(82,113,255,.35)" ' +
            'onmouseover="this.style.background=\'#3b5bdb\'" onmouseout="this.style.background=\'#5271ff\'">Entrar como Admin</button>' +
        '</div>' +
      '</div>';

    /* Estilos do overlay */
    el.style.cssText =
      'display:none;position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:9999;' +
      'align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)';

    var box = el.querySelector('#sb-modal-admin-box');
    box.style.cssText =
      'background:#fff;border-radius:16px;padding:28px;width:380px;max-width:100%;' +
      'box-shadow:0 24px 64px rgba(0,0,0,.3);animation:sbAdminIn .25s cubic-bezier(.16,1,.3,1)';

    /* Fecha ao clicar fora */
    el.addEventListener('click', function(e) {
      if (e.target === el) sbFecharModalAdmin();
    });

    /* Keyframe */
    if (!document.getElementById('sb-admin-style')) {
      var st = document.createElement('style');
      st.id = 'sb-admin-style';
      st.textContent = '@keyframes sbAdminIn{from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}';
      document.head.appendChild(st);
    }

    document.body.appendChild(el);
  }

  window.sbAbrirModalAdmin = function() {
    criarModalAdmin();
    var modal = document.getElementById('sb-modal-admin');
    var inp   = document.getElementById('sb-admin-inp');
    var erro  = document.getElementById('sb-admin-erro');
    modal.style.display = 'flex';
    erro.style.display  = 'none';
    inp.value = '';
    setTimeout(function() { inp.focus(); }, 80);
  };

  window.sbFecharModalAdmin = function() {
    var modal = document.getElementById('sb-modal-admin');
    if (modal) modal.style.display = 'none';
  };

  window.sbConfirmarAdmin = function() {
    var inp  = document.getElementById('sb-admin-inp');
    var erro = document.getElementById('sb-admin-erro');
    var senha = inp ? inp.value : '';

    if (senha !== 'gu16ma16') {
      erro.style.display = 'block';
      inp.style.borderColor = '#ef4444';
      inp.style.boxShadow   = '0 0 0 3px rgba(239,68,68,.1)';
      inp.value = '';
      setTimeout(function() { inp.focus(); }, 50);
      return;
    }

    /* TROCA SESSÃO PARA ADMIN — salva SOMENTE no sessionStorage.
       O localStorage permanece como 'usuario', então ao fechar a aba
       e reabrir o sistema volta automaticamente para usuário. */
    var sessao = {
      user:    'admin',
      role:    'admin',
      nome:    'Admin',
      cargo:   'Gerente',
      elevado: true,
      ts:      Date.now()
    };
    sessionStorage.setItem('mnd_session', JSON.stringify(sessao));

    sbFecharModalAdmin();

    /* Recarrega a página para aplicar o novo role */
    window.location.reload();
  };

  window.sbSairModoAdmin = function() {
    /* Remove o admin do sessionStorage — localStorage já é usuario */
    sessionStorage.removeItem('mnd_session');
    var sessao = {
      user:  'usuario',
      role:  'usuario',
      nome:  'Usuário',
      cargo: 'Operador',
      ts:    Date.now()
    };
    localStorage.setItem('mnd_session', JSON.stringify(sessao));
    window.location.href = 'vendas.html';
  };

  /* ── INJETAR SIDEBAR NO DOM ── */
  function inject() {
    var sess = getSessao();

    var sb = document.createElement('div');
    sb.id = 'sidebar';
    sb.innerHTML = buildSidebar(sess);

    var overlay = document.createElement('div');
    overlay.className = 'sb-overlay';
    overlay.id = 'sb-overlay';

    if (!document.getElementById('main-content')) {
      var mc = document.createElement('div');
      mc.id = 'main-content';
      while (document.body.firstChild) mc.appendChild(document.body.firstChild);
      document.body.appendChild(sb);
      document.body.appendChild(overlay);
      document.body.appendChild(mc);
    } else {
      document.body.insertBefore(sb, document.body.firstChild);
      document.body.insertBefore(overlay, document.body.firstChild);
    }

    document.body.style.display   = 'flex';
    document.body.style.minHeight = '100vh';

    var collapsed = localStorage.getItem('sb_collapsed') === '1';
    if (collapsed) sb.classList.add('collapsed');

    document.getElementById('sb-toggle').addEventListener('click', function () {
      sb.classList.toggle('collapsed');
      localStorage.setItem('sb_collapsed', sb.classList.contains('collapsed') ? '1' : '0');
    });

    overlay.addEventListener('click', function () {
      sb.classList.remove('mobile-open');
      overlay.classList.remove('vis');
    });

    window.toggleSidebarMobile = function () {
      var isOpen = sb.classList.contains('mobile-open');
      sb.classList.toggle('mobile-open', !isOpen);
      overlay.classList.toggle('vis', !isOpen);
    };

    atualizarBadges();
  }

  /* ── BADGES ── */
  async function atualizarBadges() {
    if (typeof window.supabase === 'undefined') return;
    var SUPA_URL = 'https://xyvsgvzgmwmvxtdxhjiw.supabase.co';
    var SUPA_KEY = 'sb_publishable_da-bSRiEwES37SKPryK-Uw_fvNuiLNE';
    try {
      var db = window.supabase.createClient(SUPA_URL, SUPA_KEY);

      var rFiado = await db.from('pagamentos_pendentes').select('id',{count:'exact'}).in('status',['pendente','parcial']);
      var cFiado = rFiado.count || 0;
      var bFiado = document.getElementById('fiadoBadge');
      if (bFiado) { bFiado.textContent = cFiado; bFiado.style.display = cFiado > 0 ? 'inline-block' : 'none'; }

      var rOS = await db.from('ordens_servico').select('id',{count:'exact'}).in('status',['aberta','em_execucao','aguardando_peca']);
      var cOS = rOS.count || 0;
      var bOS = document.getElementById('osBadge');
      if (bOS) { bOS.textContent = cOS; bOS.style.display = cOS > 0 ? 'inline-block' : 'none'; }
    } catch (e) { console.warn('[sidebar] badges:', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

})();
