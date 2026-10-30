/**
 * ============================================================================
 * SlideVault Real-Time Identity & Auth State Synchronizer (auth-state.js)
 * ----------------------------------------------------------------------------
 * Tự động đồng bộ hóa tài khoản thật Google & GitHub từ Supabase Cloud OAuth
 * Xóa bỏ 100% mọi vết tích 'David Le', 'Drake Le', 'DL' trong hệ thống và bộ nhớ cache
 * Hiển thị chính xác trên toàn bộ giao diện website:
 *   1. Ảnh đại diện Avatar thật (Google / GitHub)
 *   2. Tên đầy đủ (full_name) thật
 *   3. Nickname / username thật của tài khoản
 *   4. Email thật & Huy hiệu Provider (GOOGLE / GITHUB)
 * ============================================================================
 */
(() => {
  'use strict';

  // DỌN DẸP DỮ LIỆU CŨ TỪ BỘ NHỚ LOCALSTORAGE
  try {
    const raw = localStorage.getItem('slidevault_current_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (
        !u ||
        u.email === 'drake@slidevault.ai' ||
        u.email === 'admin@slidevault.ai' ||
        /drake|david/i.test(u.name || '') ||
        /drake|david/i.test(u.nickname || '') ||
        u.avatar === 'DL' ||
        u.name === 'Drake Le' ||
        u.name === 'David Le'
      ) {
        localStorage.removeItem('slidevault_current_user');
      }
    }
  } catch (e) {}

  const SUPABASE_URL = "https://jseyqlmwoyxsediwmmxl.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_AjrkbEqWYNWQRz84EJu0wQ_k0mtSkZW";

  let supabaseClient = null;

  // 1. Khởi tạo Supabase Client
  function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          }
        });
        return supabaseClient;
      } catch (err) {
        console.warn('[SlideVaultAuth] Lỗi khởi tạo Supabase:', err);
      }
    }
    return null;
  }

  // 2. Trích xuất thông tin người dùng từ Supabase User Object
  function extractUserData(user) {
    if (!user) return null;

    const meta = user.user_metadata || {};
    const appMeta = user.app_metadata || {};
    const identities = user.identities || [];
    const firstIdentity = identities[0] || {};
    const idData = firstIdentity.identity_data || {};

    // Tìm tên đầy đủ
    const fullName = meta.full_name || 
                     meta.name || 
                     idData.full_name || 
                     idData.name || 
                     user.name || 
                     (user.email ? user.email.split('@')[0] : 'Thành Viên VIP');

    // Tìm nickname / username
    const nickname = meta.user_name || 
                     meta.preferred_username || 
                     meta.nickname || 
                     idData.user_name || 
                     idData.preferred_username || 
                     (user.email ? user.email.split('@')[0] : '');

    // Tìm ảnh đại diện thật (Google / GitHub)
    const avatarUrl = meta.avatar_url || 
                      meta.picture || 
                      meta.avatar || 
                      idData.avatar_url || 
                      idData.picture || 
                      user.avatar || 
                      null;

    const email = user.email || meta.email || '';
    const rawProvider = appMeta.provider || firstIdentity.provider || user.provider || 'OAuth';
    const provider = String(rawProvider).toUpperCase();

    return {
      id: user.id || 'usr_' + Date.now(),
      name: fullName,
      nickname: nickname,
      avatar: avatarUrl,
      email: email,
      provider: provider,
      isLoggedIn: true,
      lastSync: new Date().toISOString()
    };
  }

  // 3. Cập nhật DOM trên tất cả các trang
  function applyUserToDOM(userData) {
    console.log('[SlideVaultAuth] applyUserToDOM called with:', userData);
    const isLogged = Boolean(userData && userData.isLoggedIn && userData.email);
    const name = isLogged ? userData.name : 'Khách';
    const nickname = isLogged ? (userData.nickname || userData.email.split('@')[0]) : '';
    const email = isLogged ? userData.email : 'Chưa đăng nhập';
    const avatar = isLogged ? userData.avatar : null;
    const provider = isLogged ? (userData.provider || 'OAUTH').toUpperCase() : '';

    // ==========================================
    // A. Cập nhật Sidebar Footer Profile (ở tất cả các trang)
    // ==========================================
    document.querySelectorAll('.sidebar-footer-profile, .user-profile-pill').forEach(container => {
      const avatarEl = container.querySelector('#sidebarUserAvatar') || 
                       container.querySelector('.w-8.h-8') || 
                       container.querySelector('[class*="w-8"]');
      if (avatarEl) {
        if (isLogged && avatar) {
          avatarEl.innerHTML = `<img src="${avatar}" alt="${name}" class="w-full h-full rounded-full object-cover shadow-sm ring-1 ring-emerald-400/30" onerror="this.parentElement.textContent='${name.charAt(0).toUpperCase()}';">`;
        } else if (isLogged) {
          avatarEl.innerHTML = `<div class="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">${name.charAt(0).toUpperCase()}</div>`;
        } else {
          avatarEl.innerHTML = `<div class="w-full h-full rounded-full bg-surface-pill border border-border/60 flex items-center justify-center text-muted-foreground"><i data-lucide="user" class="w-3.5 h-3.5"></i></div>`;
        }
      }

      const nameEl = container.querySelector('#sidebarUserName') || 
                     container.querySelector('.font-semibold.truncate') ||
                     container.querySelector('.text-xs.font-semibold');
      if (nameEl) {
        nameEl.textContent = isLogged ? name : 'Khách';
      }

      const emailEl = container.querySelector('#sidebarUserEmail') || 
                      container.querySelector('.text-\\[10px\\].text-muted-foreground') ||
                      container.querySelector('.text-muted-foreground.truncate');
      if (emailEl) {
        emailEl.textContent = isLogged ? (nickname ? `@${nickname}` : email) : 'Bấm để đăng nhập';
      }

      if (!isLogged) {
        container.style.cursor = 'pointer';
        container.title = 'Bấm để đăng nhập';
        container.onclick = (e) => {
          if (!e.target.closest('button')) {
            window.location.href = 'dangnhap.html';
          }
        };
      } else {
        container.style.cursor = 'pointer';
        container.title = `Tài khoản: ${name} (${email})`;
        container.onclick = (e) => {
          if (!e.target.closest('button')) {
            window.location.href = 'setting.html';
          }
        };
      }
    });

    // ==========================================
    // B. Cập nhật Topbar (#navUserSlot & #topbarAuthSlot) - Chuẩn Apple Circular Avatar (Không 3 chấm)
    // ==========================================
    const navSlots = document.querySelectorAll('#navUserSlot, #topbarAuthSlot, [data-auth-slot]');
    navSlots.forEach(slot => {
      if (isLogged) {
        slot.classList.remove('hidden');
        slot.innerHTML = `
          <div class="relative group" data-user-menu-root>
            <button type="button" data-user-menu-btn class="flex items-center justify-center p-0.5 rounded-full bg-surface-pill hover:bg-muted/80 border border-border/70 hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0" aria-label="Tài khoản: ${name}" title="${name} (${email})">
              <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-inner ring-1 ring-white/20">
                ${avatar ? `<img src="${avatar}" alt="${name}" class="w-full h-full object-cover">` : name.charAt(0).toUpperCase()}
              </div>
            </button>
            <div data-user-menu-dropdown class="absolute right-0 top-full mt-2 w-56 p-2 rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl hidden group-hover:block hover:block z-50">
              <div class="px-3 py-2.5 border-b border-border/40">
                <div class="text-xs font-bold text-foreground leading-snug">${name}</div>
                <div class="text-[11px] text-muted-foreground break-all">${email}</div>
                <div class="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>${provider}</span>
                  ${nickname ? `<span>• @${nickname}</span>` : ''}
                </div>
              </div>
              <div class="py-1">
                <a href="phone.html" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-foreground hover:bg-muted text-decoration-none transition-colors">
                  <i data-lucide="smartphone" class="w-4 h-4 text-indigo-400"></i>
                  <span>Điều khiển 3D Touch</span>
                </a>
                <a href="setting.html" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-foreground hover:bg-muted text-decoration-none transition-colors">
                  <i data-lucide="settings" class="w-4 h-4 text-muted-foreground"></i>
                  <span>Cài đặt tài khoản</span>
                </a>
              </div>
              <div class="pt-1 border-t border-border/40">
                <button type="button" onclick="window.SlideVaultAuth.logout()" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 text-left transition-colors">
                  <i data-lucide="log-out" class="w-4 h-4"></i>
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        `;
        const menuBtn = slot.querySelector('[data-user-menu-btn]');
        const menuDropdown = slot.querySelector('[data-user-menu-dropdown]');
        if (menuBtn && menuDropdown) {
          menuBtn.onclick = (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('hidden');
          };
        }
      } else {
        slot.innerHTML = `
          <a href="dangnhap.html" class="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-full bg-surface-pill border border-border/60 text-xs font-semibold text-foreground hover:bg-muted transition-colors text-decoration-none" title="Đăng nhập">
            <i data-lucide="user" class="w-3.5 h-3.5 text-muted-foreground"></i>
            <span class="hidden sm:inline ml-1.5">Đăng nhập</span>
          </a>
        `;
      }
    });

    if (!window._svUserMenuListenerAdded) {
      window._svUserMenuListenerAdded = true;
      document.addEventListener('click', (e) => {
        if (!e.target.closest('[data-user-menu-root]')) {
          document.querySelectorAll('[data-user-menu-dropdown]').forEach(d => d.classList.add('hidden'));
        }
      });
    }

    // ==========================================
    // C. Cập nhật Trang Cài Đặt (setting.html)
    // ==========================================
    const settingAvatar = document.getElementById('settingUserAvatar');
    const settingName = document.getElementById('settingUserName');
    const settingEmail = document.getElementById('settingUserEmail');
    const settingInputName = document.getElementById('settingInputName');
    const settingInputEmail = document.getElementById('settingInputEmail');
    const settingTier = document.getElementById('settingUserTierBadge');
    const settingActionArea = document.getElementById('settingAuthActionArea');
    const settingStatus = document.getElementById('settingUserSecurityStatus');

    if (settingAvatar) {
      if (isLogged && avatar) {
        settingAvatar.innerHTML = `<img src="${avatar}" alt="${name}" class="w-full h-full rounded-3xl object-cover shadow-xl" onerror="this.parentElement.textContent='${name.charAt(0).toUpperCase()}';">`;
      } else if (isLogged) {
        settingAvatar.innerHTML = `<div class="w-full h-full rounded-3xl bg-indigo-600 flex items-center justify-center text-xl font-bold text-white">${name.charAt(0).toUpperCase()}</div>`;
      } else {
        settingAvatar.innerHTML = `<div class="w-full h-full rounded-3xl bg-surface-pill border border-border/60 flex items-center justify-center text-muted-foreground"><i data-lucide="user" class="w-8 h-8"></i></div>`;
      }
    }
    if (settingName) settingName.textContent = isLogged ? `${name} ${nickname ? `(@${nickname})` : ''}` : 'Khách Vãng Lai';
    if (settingEmail) settingEmail.textContent = isLogged ? `${email} • Xác thực ${provider}` : 'Chưa đăng nhập hệ thống';
    if (settingInputName && isLogged) settingInputName.value = name;
    if (settingInputEmail && isLogged) settingInputEmail.value = email;
    if (settingTier) {
      settingTier.textContent = isLogged ? `Tài Khoản ${provider} VIP` : 'Chưa Đăng Nhập';
      settingTier.className = isLogged 
        ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
        : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30';
    }
    if (settingStatus && isLogged) {
      settingStatus.innerHTML = `<i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400 inline"></i> Đã bảo vệ xác thực OAuth ${provider}`;
    }
    if (settingActionArea) {
      if (isLogged) {
        settingActionArea.innerHTML = `
          <button type="button" onclick="window.SlideVaultAuth.logout()" class="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <i data-lucide="log-out" class="w-3.5 h-3.5 text-rose-400"></i>
            <span>Đăng Xuất (${email})</span>
          </button>
        `;
      } else {
        settingActionArea.innerHTML = `
          <a href="dangnhap.html" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 text-decoration-none active:scale-95">
            <i data-lucide="log-in" class="w-3.5 h-3.5"></i>
            <span>Đăng Nhập Ngay</span>
          </a>
        `;
      }
    }

    // ==========================================
    // D. Cập nhật Trang Điều Khiển Remote (phone.html)
    // ==========================================
    const phoneAvatarImg = document.getElementById('userAvatarImg');
    const phoneAvatarFallback = document.getElementById('userAvatarFallback');
    const phoneFullName = document.getElementById('userFullName');
    const phoneEmail = document.getElementById('userEmail');
    const phoneBadge = document.getElementById('userProviderBadge');
    const phoneOverlay = document.getElementById('authLoadingOverlay');

    if (phoneFullName && isLogged) {
      phoneFullName.textContent = nickname ? `${name} (@${nickname})` : name;
      if (phoneEmail) phoneEmail.textContent = email;
      if (phoneBadge) phoneBadge.textContent = provider;

      if (avatar && phoneAvatarImg && phoneAvatarFallback) {
        phoneAvatarImg.src = avatar;
        phoneAvatarImg.classList.remove('hidden');
        phoneAvatarFallback.classList.add('hidden');
      } else if (phoneAvatarFallback) {
        phoneAvatarFallback.textContent = name.charAt(0).toUpperCase();
        phoneAvatarFallback.classList.remove('hidden');
        if (phoneAvatarImg) phoneAvatarImg.classList.add('hidden');
      }

      if (phoneOverlay) {
        phoneOverlay.classList.add('opacity-0', 'pointer-events-none');
      }
    }

    // Tái tạo icon Lucide nếu có
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // 4. Bắt và xử lý token từ URL (OAuth Redirect Hash hoặc PKCE Code)
  async function handleUrlTokens() {
    console.log('[SlideVaultAuth] handleUrlTokens() called, hash:', window.location.hash ? 'YES' : 'NO', 'search:', window.location.search ? 'YES' : 'NO');
    const sb = getSupabaseClient();
    if (!sb) { console.warn('[SlideVaultAuth] Supabase client NULL!'); return false; }

    // Kiểm tra lỗi OAuth từ Supabase
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const oauthError = searchParams.get('error_description') || hashParams.get('error_description') || searchParams.get('error') || hashParams.get('error');
    if (oauthError) {
      console.warn('[SlideVaultAuth] Phát hiện lỗi OAuth từ URL:', decodeURIComponent(oauthError).replace(/\+/g, ' '));
      return false;
    }

    // A. Xử lý Hash: #access_token=...&refresh_token=...
    if (window.location.hash && window.location.hash.includes('access_token=')) {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token') || '';

        if (accessToken) {
          const { data, error } = await sb.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          // Làm sạch URL trên thanh địa chỉ trình duyệt
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
          }

          if (data && data.session && data.session.user) {
            const userData = extractUserData(data.session.user);
            localStorage.setItem('slidevault_current_user', JSON.stringify(userData));
            applyUserToDOM(userData);
            return true;
          }
        }
      } catch (err) {
        console.warn('[SlideVaultAuth] Lỗi xử lý OAuth Hash:', err);
      }
    }

    // B. Xử lý Search Code: ?code=...
    if (window.location.search && window.location.search.includes('code=')) {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          const { data, error } = await sb.auth.exchangeCodeForSession(code);
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, document.title, window.location.pathname);
          }
          if (data && data.session && data.session.user) {
            const userData = extractUserData(data.session.user);
            localStorage.setItem('slidevault_current_user', JSON.stringify(userData));
            applyUserToDOM(userData);
            return true;
          }
        }
      } catch (err) {
        console.warn('[SlideVaultAuth] Lỗi xử lý OAuth Code:', err);
      }
    }

    return false;
  }

  // 5. Đồng bộ toàn diện trạng thái xác thực
  async function syncAuthState() {
    // 1. Ưu tiên xử lý token từ URL trước
    const handledFromUrl = await handleUrlTokens();
    if (handledFromUrl) return;

    const sb = getSupabaseClient();
    let currentUser = null;

    // 2. Đọc session từ Supabase Client
    if (sb) {
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (session && session.user) {
          currentUser = extractUserData(session.user);
        } else {
          const { data: { user } } = await sb.auth.getUser();
          if (user) currentUser = extractUserData(user);
        }
      } catch (e) {
        console.warn('[SlideVaultAuth] Lỗi đọc session Supabase:', e);
      }
    }

    // 3. Fallback sang localStorage hợp lệ
    if (!currentUser) {
      try {
        const local = JSON.parse(localStorage.getItem('slidevault_current_user') || 'null');
        if (local && local.email && local.email !== 'drake@slidevault.ai') {
          currentUser = local;
        }
      } catch (e) {}
    }

    // 4. Lưu và cập nhật DOM
    if (currentUser) {
      localStorage.setItem('slidevault_current_user', JSON.stringify(currentUser));
      applyUserToDOM(currentUser);
    } else {
      localStorage.removeItem('slidevault_current_user');
      applyUserToDOM(null);
    }

    // 5. Gắn lắng nghe Auth State Change của Supabase
    if (sb && !window.__sv_auth_listener_bound) {
      window.__sv_auth_listener_bound = true;
      sb.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          const u = extractUserData(session.user);
          localStorage.setItem('slidevault_current_user', JSON.stringify(u));
          applyUserToDOM(u);
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('slidevault_current_user');
          applyUserToDOM(null);
        }
      });
    }
  }

  // 6. Cung cấp API toàn cục window.SlideVaultAuth
  window.SlideVaultAuth = {
    loginWithGoogle: async (targetUrl) => {
      let defaultTarget = 'trangchudong.html';
      if (window.location.pathname.includes('phone')) {
        defaultTarget = 'phone.html';
      }
      const redirect = targetUrl || (window.location.origin + '/' + defaultTarget);
      console.log('[SlideVaultAuth] Initiating Google login, redirect:', redirect);
      const sb = getSupabaseClient();
      if (sb && sb.auth && typeof sb.auth.signInWithOAuth === 'function') {
        try {
          const { data, error } = await sb.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirect,
              queryParams: {
                access_type: 'offline',
                prompt: 'select_account'
              }
            }
          });
          if (error) {
            console.warn('[SlideVaultAuth] signInWithOAuth fallback:', error);
            window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirect)}`;
          }
        } catch (e) {
          window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirect)}`;
        }
      } else {
        window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirect)}`;
      }
    },
    loginWithGithub: async (targetUrl) => {
      let defaultTarget = 'trangchudong.html';
      if (window.location.pathname.includes('phone')) {
        defaultTarget = 'phone.html';
      }
      const redirect = targetUrl || (window.location.origin + '/' + defaultTarget);
      console.log('[SlideVaultAuth] Initiating GitHub login, redirect:', redirect);
      const sb = getSupabaseClient();
      if (sb && sb.auth && typeof sb.auth.signInWithOAuth === 'function') {
        try {
          const { data, error } = await sb.auth.signInWithOAuth({
            provider: 'github',
            options: {
              redirectTo: redirect
            }
          });
          if (error) {
            window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(redirect)}`;
          }
        } catch (e) {
          window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(redirect)}`;
        }
      } else {
        window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(redirect)}`;
      }
    },
    logout: async () => {
      const sb = getSupabaseClient();
      try {
        if (sb) await sb.auth.signOut();
      } catch (e) {}
      localStorage.removeItem('slidevault_current_user');
      window.location.href = 'dangnhap.html';
    },
    sync: syncAuthState,
    getClient: getSupabaseClient,
    getUser: () => {
      try {
        return JSON.parse(localStorage.getItem('slidevault_current_user') || 'null');
      } catch (e) {
        return null;
      }
    }
  };

  // Tự động kích hoạt ngay khi nạp script và khi DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncAuthState);
  } else {
    syncAuthState();
  }
})();
