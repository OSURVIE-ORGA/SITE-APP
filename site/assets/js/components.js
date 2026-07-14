/* =============================================
   COMPOSANTS PARTAGÉS — Navigation & Footer
   Modifier ce fichier modifie la nav et le footer
   sur TOUTES les pages du site automatiquement.
   =============================================

   Usage dans une page HTML :
     <div id="site-nav-mount"></div>     -> placeholder pour la nav
     <div id="site-footer-mount"></div>  -> placeholder pour le footer
     <script src="../assets/js/components.js"></script>
*/

(function () {
  'use strict';

  /* ---------- Détecte le niveau de la page pour générer les bons chemins relatifs ---------- */
  function getPaths() {
    var path = window.location.pathname.replace(/\\/g, '/');

    var isInActions   = /\/pages\/actions\//.test(path);
    var isInLegal     = /\/pages\/legal\//.test(path);
    var isInPagesRoot = /\/pages\//.test(path) && !isInActions && !isInLegal;

    if (isInActions || isInLegal) {
      return {
        home:   '../../index.html',
        pages:  '../',
        legal:  isInLegal ? '' : '../legal/'
      };
    }
    if (isInPagesRoot) {
      return {
        home:   '../index.html',
        pages:  '',
        legal:  'legal/'
      };
    }
    // Racine (index.html)
    return {
      home:   'index.html',
      pages:  'pages/',
      legal:  'pages/legal/'
    };
  }

  /* ---------- TEMPLATE : NAVIGATION ---------- */
  function buildNav(paths) {
    return ''
      + '<nav class="site-nav" id="siteNav" aria-label="Navigation principale">'
      +   '<a href="' + paths.home + '" class="nav-brand"><span class="nav-brand-o">O\'</span>SURVIE</a>'
      +   '<ul class="nav-links" id="navLinks">'
      +     '<li><a href="' + paths.home + '">Accueil</a></li>'
      +     '<li><a href="' + paths.pages + 'a-propos.html">L\'association</a></li>'
      +     '<li><a href="' + paths.pages + 'planning.html">Événements</a></li>'
      +     '<li class="nav-dropdown">'
      +       '<button class="nav-dropdown-toggle" aria-expanded="false" aria-haspopup="true">S\'engager <span class="nav-chevron" aria-hidden="true"></span></button>'
      +       '<ul class="nav-dropdown-menu" role="menu">'
      +         '<li role="none"><a href="' + paths.pages + 'benevolat.html" role="menuitem">Bénévolat</a></li>'
      +         '<li role="none"><a href="' + paths.pages + 'mecenat.html" role="menuitem">Partenariat</a></li>'
      +       '</ul>'
      +     '</li>'
      +     '<li><a href="' + paths.pages + 'contact.html">Contact</a></li>'
      +   '</ul>'
      +   '<a href="' + paths.pages + 'dons.html" class="nav-cta">Faire un don</a>'
      +   '<button class="nav-toggle" id="navToggle" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="navLinks">&#9776;</button>'
      + '</nav>';
  }

  /* ---------- TEMPLATE : FOOTER ---------- */
  function buildFooter(paths) {
    return ''
      + '<footer class="site-footer">'
      +   '<div class="site-footer-inner">'
      +     '<div class="site-footer-brand">'
      +       '<a href="' + paths.home + '" class="site-footer-logo"><strong>O\'</strong>SURVIE</a>'
      +       '<p class="site-footer-tagline">Solidarité, lien social et actions citoyennes à Bondy Nord. Depuis 2020.</p>'
      +     '</div>'
      +     '<div class="site-footer-cols">'
      +       '<div class="site-footer-col">'
      +         '<h4>Navigation</h4>'
      +         '<ul>'
      +           '<li><a href="' + paths.pages + 'a-propos.html">L\'association</a></li>'
      +           '<li><a href="' + paths.pages + 'planning.html">Événements</a></li>'
      +           '<li><a href="' + paths.pages + 'benevolat.html">Bénévolat</a></li>'
      +           '<li><a href="' + paths.pages + 'mecenat.html">Partenariat</a></li>'
      +           '<li><a href="' + paths.pages + 'contact.html">Contact</a></li>'
      +           '<li><a href="' + paths.pages + 'dons.html">Faire un don</a></li>'
      +         '</ul>'
      +       '</div>'
      +       '<div class="site-footer-col">'
      +         '<h4>Contact</h4>'
      +         '<p>6 Square du 8 Mai 1945<br>93140 Bondy</p>'
      +         '<p><a href="mailto:contact@osurvie.fr">contact@osurvie.fr</a></p>'
      +       '</div>'
      +       '<div class="site-footer-col">'
      +         '<h4>Légal</h4>'
      +         '<ul>'
      +           '<li><a href="' + paths.legal + 'mentions.html">Mentions légales</a></li>'
      +           '<li><a href="' + paths.legal + 'cgu.html">CGU</a></li>'
      +           '<li><a href="' + paths.legal + 'politique-de-confidentialite.html">Confidentialité</a></li>'
      +         '</ul>'
      +       '</div>'
      +     '</div>'
      +   '</div>'
      +   '<div class="site-footer-bottom">'
      +     '<span>&copy; 2026 Association O\'SURVIE — Loi 1901</span>'
      +     '<span>Tous droits réservés</span>'
      +   '</div>'
      + '</footer>';
  }

  /* ---------- LIEN ACTIF ---------- */
  function markActiveLink() {
    var path = window.location.pathname.replace(/\\/g, '/');
    var nav  = document.getElementById('siteNav');
    if (!nav) return;

    nav.querySelectorAll('.nav-links a, .nav-dropdown-menu a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      /* Normalise le href en chemin absolu fictif pour comparaison */
      var hrefPath = href.replace(/\\/g, '/');
      /* Extrait le nom de fichier */
      var hrefFile = hrefPath.split('/').pop();
      var pathFile = path.split('/').pop();

      if (hrefFile && pathFile && hrefFile === pathFile) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
        /* Si le lien actif est dans un dropdown, marquer aussi le bouton parent */
        var dropdown = a.closest('.nav-dropdown');
        if (dropdown) {
          var btn = dropdown.querySelector('.nav-dropdown-toggle');
          if (btn) btn.classList.add('active');
        }
      }
    });

    /* Cas accueil : index.html ou chemin racine "/" */
    if (path === '/' || path.endsWith('/index.html') || path.endsWith('/')) {
      var homeLink = nav.querySelector('.nav-links > li > a[href$="index.html"]');
      if (homeLink) {
        homeLink.classList.add('active');
        homeLink.setAttribute('aria-current', 'page');
      }
    }
  }

  /* ---------- COMPORTEMENT NAV (scroll + hamburger + dropdown) ---------- */
  function attachNavBehavior() {
    var nav    = document.getElementById('siteNav');
    var toggle = document.getElementById('navToggle');
    var links  = document.getElementById('navLinks');
    if (!nav || !toggle || !links) return;

    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    });

    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });

    /* Dropdown S'engager */
    var dropdownToggle = nav.querySelector('.nav-dropdown-toggle');
    if (dropdownToggle) {
      dropdownToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var parent = dropdownToggle.closest('.nav-dropdown');
        var open = parent.classList.toggle('open');
        dropdownToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      /* Ferme le dropdown si clic ailleurs */
      document.addEventListener('click', function () {
        var parent = nav.querySelector('.nav-dropdown');
        if (parent) {
          parent.classList.remove('open');
          dropdownToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /* ---------- INJECTION ---------- */
  function inject() {
    var paths = getPaths();

    var navMount = document.getElementById('site-nav-mount');
    if (navMount) navMount.outerHTML = buildNav(paths);

    var footerMount = document.getElementById('site-footer-mount');
    if (footerMount) footerMount.outerHTML = buildFooter(paths);

    attachNavBehavior();
    markActiveLink();
  }

  /* ---------- AUTO-EXÉCUTION ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
