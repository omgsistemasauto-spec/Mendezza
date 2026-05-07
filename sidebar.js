/* ============================================================
   SIDEBAR.JS — Mendezza Auto Peças
   Inclua antes do </body> de todas as páginas:
   <script src="sidebar.js"></script>
   ============================================================ */

(function () {

  /* ── MAPEAMENTO DE PÁGINAS ──
     Cada entrada tem: href, ícone, label, tooltip, badge (opcional)      */
  var MENU = [
    { section: 'Principal' },
    { href: 'vendas.html',      icon: '🛒', label: 'Vendas',        tip: 'Vendas' },
    { href: 'checkin.html',     icon: '🔑', label: 'Check-in',      tip: 'Check-in' },
    { section: 'Estoque' },
    { href: 'estoque.html',     icon: '📦', label: 'Estoque',       tip: 'Estoque' },
    { section: 'Gestão' },
    { href: 'financeiro.html',  icon: '💰', label: 'Financeiro',    tip: 'Financeiro' },
    { href: 'vendas.html#fiado',icon: '💳', label: 'Fiado',         tip: 'Fiado',         badge: 'fiadoBadge' },
    { href: 'vendas.html#os',   icon: '📋', label: 'Ordens de Serv.',tip: 'Ordens OS',    badge: 'osBadge' },
  ];

  /* ── HTML DO SIDEBAR ── */
  function buildSidebar() {
    var pagina = window.location.pathname.split('/').pop() || 'index.html';

    var navHtml = MENU.map(function (item) {
      if (item.section) {
        return '<div class="sb-section">' + item.section + '</div>';
      }
      var base = item.href.split('#')[0];
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

    var html =
      '<div class="sb-toggle" id="sb-toggle" title="Recolher menu">' +
        '<svg viewBox="0 0 10 10"><path d="M7 1L3 5l4 4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</div>' +
      '<a href="vendas.html" class="sb-logo">' +
        '<div class="sb-logo-icon">M</div>' +
        '<div class="sb-logo-txt">' +
          '<span>Mendezza</span>' +
          '<span>Auto Peças</span>' +
        '</div>' +
      '</a>' +
      '<nav class="sb-nav">' + navHtml + '</nav>' +
      '<div class="sb-user">' +
        '<div class="sb-user-avatar" title="Admin">A</div>' +
        '<div class="sb-user-info">' +
          '<span>Admin</span>' +
          '<span>Gerente</span>' +
        '</div>' +
      '</div>';

    return html;
  }

  /* ── INJETAR SIDEBAR NO DOM ── */
  function inject() {
    /* Cria o elemento sidebar */
    var sb = document.createElement('div');
    sb.id = 'sidebar';
    sb.innerHTML = buildSidebar();

    /* Cria overlay mobile */
    var overlay = document.createElement('div');
    overlay.className = 'sb-overlay';
    overlay.id = 'sb-overlay';

    /* Envolve o conteúdo atual em #main-content se ainda não existir */
    if (!document.getElementById('main-content')) {
      var mc = document.createElement('div');
      mc.id = 'main-content';
      /* move todos os filhos do body para mc */
      while (document.body.firstChild) {
        mc.appendChild(document.body.firstChild);
      }
      document.body.appendChild(sb);
      document.body.appendChild(overlay);
      document.body.appendChild(mc);
    } else {
      document.body.insertBefore(sb, document.body.firstChild);
      document.body.insertBefore(overlay, document.body.firstChild);
    }

    /* Adiciona classe flex ao body */
    document.body.style.display  = 'flex';
    document.body.style.minHeight = '100vh';

    /* ── TOGGLE COLLAPSE ── */
    var collapsed = localStorage.getItem('sb_collapsed') === '1';
    if (collapsed) sb.classList.add('collapsed');

    document.getElementById('sb-toggle').addEventListener('click', function () {
      sb.classList.toggle('collapsed');
      localStorage.setItem('sb_collapsed', sb.classList.contains('collapsed') ? '1' : '0');
    });

    /* ── MOBILE: abre/fecha com botão hambúrguer ── */
    overlay.addEventListener('click', function () {
      sb.classList.remove('mobile-open');
      overlay.classList.remove('vis');
    });

    /* Expõe função global para abrir o menu mobile */
    window.toggleSidebarMobile = function () {
      var isOpen = sb.classList.contains('mobile-open');
      sb.classList.toggle('mobile-open', !isOpen);
      overlay.classList.toggle('vis', !isOpen);
    };

    /* ── BADGES: atualiza contadores ── */
    atualizarBadges();
  }

  /* ── ATUALIZAR BADGES (contas pendentes, OS abertas) ── */
  async function atualizarBadges() {
    /* Só executa se Supabase estiver disponível */
    if (typeof window.supabase === 'undefined') return;

    var SUPA_URL = 'https://xyvsgvzgmwmvxtdxhjiw.supabase.co';
    var SUPA_KEY = 'sb_publishable_da-bSRiEwES37SKPryK-Uw_fvNuiLNE';

    try {
      var db = window.supabase.createClient(SUPA_URL, SUPA_KEY);

      /* Fiado pendente */
      var rFiado = await db.from('pagamentos_pendentes')
        .select('id', { count: 'exact' })
        .in('status', ['pendente', 'parcial']);
      var cFiado = rFiado.count || 0;
      var badgeFiado = document.getElementById('fiadoBadge');
      if (badgeFiado) {
        badgeFiado.textContent = cFiado;
        badgeFiado.style.display = cFiado > 0 ? 'inline-block' : 'none';
      }

      /* OS abertas */
      var rOS = await db.from('ordens_servico')
        .select('id', { count: 'exact' })
        .in('status', ['aberta', 'em_execucao', 'aguardando_peca']);
      var cOS = rOS.count || 0;
      var badgeOS = document.getElementById('osBadge');
      if (badgeOS) {
        badgeOS.textContent = cOS;
        badgeOS.style.display = cOS > 0 ? 'inline-block' : 'none';
      }
    } catch (e) {
      console.warn('[sidebar] badges:', e);
    }
  }

  /* ── INICIALIZA ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

})();