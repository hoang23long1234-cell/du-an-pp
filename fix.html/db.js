/**
 * SlideVault Core Database Engine (ACID-safe Atomic File DB)
 * Provides persistent storage for:
 * - Users & Authentication
 * - Presentation Decks & Slide JSON
 * - User Preferences & API Keys
 * - Audit & Security Event Logs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'slidevault_data.json');

const INITIAL_DATA = {
  users: [],
  decks: [
    {
      id: 'deck_sample_01',
      userId: 'usr_system',
      title: 'KHTN Lớp 10: Tế Bào Học & Hô Hấp Ti Thể',
      topic: 'KHTN Lớp 10 Tế Bào Học',
      palette: 'ROSE_GOLD',
      standard: 'SGK_KETNOI',
      slidesCount: 5,
      slides: [
        {
          module: 'CHUYÊN ĐỀ 01',
          curriculum: 'KNTT 2026-SGK',
          category: 'Cấu Trúc Tế Bào',
          title: 'Cơ Sở Tế Bào Học & Nhà Máy Năng Lượng Ti Thể',
          content: 'Nghiên cứu cấu trúc màng kép và cơ chế chuyển hóa năng lượng ATP tối ưu trong tế bào nhân thực.',
          concept1: { title: 'Đường Phân', desc: 'Diễn ra tại bào tương tế bào, bẻ gãy 1 Glucose tạo 2 Pyruvate và 2 ATP thuần.' },
          concept2: { title: 'Chuỗi Truyền Điện Tử', desc: 'Tại màng trong ti thể vận hành động cơ phân tử ATP Synthase sinh 26-28 ATP.' },
          hook: 'Thưa các em học sinh, điều gì giữ cho hàng tỷ tế bào của chúng ta vận động không ngừng nghỉ mỗi giây? Đó chính là ATP.',
          corePoint: 'Lưu ý phân tích màng trong ti thể gấp nếp hình cristae giúp tăng diện tích bề mặt gắn enzym.',
          duration: '3m40s'
        },
        {
          module: 'CHUYÊN ĐỀ 02',
          curriculum: 'KNTT 2026-SGK',
          category: 'Cơ Chế Phân Tử',
          title: 'Chu Trình Krebs & Chuyển Hóa Acetyl-CoA',
          content: 'Ma trận ti thể (Matrix) là nơi diễn ra chu trình axit citric khử NAD+ và FAD thành các chất mang điện tử.',
          concept1: { title: 'Ma Trận Ti Thể', desc: 'Chứa hệ enzyme hòa tan và DNA ti thể dạng vòng tự nhân đôi độc lập.' },
          concept2: { title: 'NADH & FADH2', desc: 'Các coenzyme mang proton và electron năng lượng cao đến màng trong.' },
          hook: 'Ti thể có hệ gen riêng biệt minh chứng cho thuyết nội cộng sinh trong quá trình tiến hóa sinh học.',
          corePoint: 'Nhấn mạnh vai trò của Acetyl-CoA làm nguyên liệu đầu vào cho chu trình.',
          duration: '4m15s'
        },
        {
          module: 'CHUYÊN ĐỀ 03',
          curriculum: 'KNTT 2026-SGK',
          category: 'Động Cơ ATP',
          title: 'Hóa Thẩm Thấu & Động Cơ Phân Tử ATP Synthase',
          content: 'Gradient nồng độ H+ giữa xoang gian màng và chất nền tạo thế năng điện hóa cực mạnh làm quay trục rotor F0F1.',
          concept1: { title: 'Bơm Proton H+', desc: 'Phức hệ I, III, IV tích cực vận chuyển proton từ matrix ra xoang gian màng.' },
          concept2: { title: 'Tổng Hợp ATP', desc: 'Mỗi vòng quay hoàn chỉnh gắn 3 nhóm phosphate tự do vào ADP tạo ATP.' },
          hook: 'Hãy hình dung ATP Synthase như một đập thủy điện tí hon hoạt động ở cấp độ nano với hiệu suất gần như tuyệt đối.',
          corePoint: 'Giải thích nguyên lý hóa thẩm thấu (Chemiosmosis) của Peter Mitchell.',
          duration: '5m00s'
        },
        {
          module: 'CHUYÊN ĐỀ 04',
          curriculum: 'KNTT 2026-SGK',
          category: 'Cân Bằng Năng Lượng',
          title: 'Hiệu Suất Năng Lượng & So Sánh Hô Hấp Hiếu Khí vs Lên Men',
          content: 'Hô hấp hiếu khí tạo 30-32 ATP/glucose, gấp 15-16 lần so với lên men lactic hoặc lên men rượu (chỉ 2 ATP).',
          concept1: { title: 'Hiếu Khí (O2)', desc: 'Chất nhận điện tử cuối cùng là oxy, tạo sản phẩm sạch CO2 và H2O.' },
          concept2: { title: 'Kị Khí (Lên Men)', desc: 'Chỉ dừng lại ở đường phân, tích tụ axit lactic gây mỏi cơ bắp.' },
          chart_type: 'bar',
          chart_data: [
            { label: 'Đường phân', value: 2 },
            { label: 'Krebs', value: 2 },
            { label: 'Chuỗi e-', value: 28 },
            { label: 'Tổng cộng', value: 32 }
          ],
          hook: 'Vì sao khi chạy nước rút chúng ta bị chuột rút mỏi cơ? Chính là do sự chuyển dịch từ hiếu khí sang kị khí.',
          corePoint: 'Củng cố công thức tính hiệu suất năng lượng (~34-38%).',
          duration: '4m30s'
        },
        {
          module: 'CHUYÊN ĐỀ 05',
          curriculum: 'KNTT 2026-SGK',
          category: 'Ứng Dụng Thực Tiễn',
          title: 'Ứng Dụng Y Sinh Học & Bảo Quản Nông Sản Sau Thu Hoạch',
          content: 'Điều khiển cường độ hô hấp tế bào là chìa khóa để ức chế lão hóa thực phẩm và điều trị bệnh lý chuyển hóa.',
          concept1: { title: 'Bảo Quản Khí Cải Biến (MAP)', desc: 'Hạ nhiệt độ và nồng độ O2, tăng nhẹ CO2 để đưa nông sản vào trạng thái ngủ.' },
          concept2: { title: 'Y Học Tái Tạo', desc: 'Bảo vệ chức năng ti thể là chiến lược hàng đầu trong chống lão hóa và thoái hóa thần kinh.' },
          hook: 'Khoa học tế bào không nằm trên trang sách mà đang bảo vệ từng bó rau, củ quả và sức khỏe người thân chúng ta.',
          corePoint: 'Tổng kết nội dung bài học và giao bài tập vận dụng về nhà.',
          duration: '3m20s'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  securityLogs: []
};

class Database {
  constructor() {
    this.data = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
        this.save();
      }
    } catch (err) {
      console.error('[Database] Lỗi đọc dữ liệu, khởi tạo bản sao lưu an toàn:', err.message);
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.save();
    }
  }

  save() {
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_FILE);
      return true;
    } catch (err) {
      console.error('[Database] Lỗi lưu dữ liệu:', err.message);
      return false;
    }
  }

  // --- Users ---
  findUserByEmail(email) {
    if (!email) return null;
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  }

  findUserById(id) {
    return this.data.users.find(u => u.id === id) || null;
  }

  createUser({ name, email, password, role = 'member' }) {
    const existing = this.findUserByEmail(email);
    if (existing) throw new Error('Email đã tồn tại trên hệ thống');

    const displayName = name || email.split('@')[0];
    const user = {
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name: displayName,
      email: email.toLowerCase().trim(),
      role,
      avatar: displayName.slice(0, 2).toUpperCase(),
      passwordHash: crypto.createHash('sha256').update(password).digest('hex'),
      createdAt: new Date().toISOString()
    };
    this.data.users.push(user);
    this.save();
    return user;
  }

  verifyUser(email, password) {
    const user = this.findUserByEmail(email);
    if (!user) return null;
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (user.passwordHash !== hash) return null;
    return user;
  }

  updateUserProfile(userId, updates) {
    const user = this.findUserById(userId);
    if (!user) return null;
    if (updates.name) user.name = updates.name.trim();
    if (updates.avatar) user.avatar = updates.avatar.trim();
    user.updatedAt = new Date().toISOString();
    this.save();
    return user;
  }

  // --- Decks & Slides ---
  listDecks(userId) {
    if (!userId) return this.data.decks;
    return this.data.decks.filter(d => d.userId === userId);
  }

  getDeckById(id) {
    return this.data.decks.find(d => d.id === id) || null;
  }

  saveDeck({ id, userId, title, topic, palette, standard, slides }) {
    const now = new Date().toISOString();
    const slidesList = Array.isArray(slides) ? slides : [];

    if (id) {
      const idx = this.data.decks.findIndex(d => d.id === id);
      if (idx !== -1) {
        this.data.decks[idx] = {
          ...this.data.decks[idx],
          title: title || this.data.decks[idx].title,
          topic: topic || this.data.decks[idx].topic,
          palette: palette || this.data.decks[idx].palette,
          standard: standard || this.data.decks[idx].standard,
          slidesCount: slidesList.length,
          slides: slidesList,
          updatedAt: now
        };
        this.save();
        return this.data.decks[idx];
      }
    }

    const newDeck = {
      id: id || `deck_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: userId || 'usr_system',
      title: title || topic || 'Bài thuyết trình mới',
      topic: topic || 'Chủ đề thuyết trình',
      palette: palette || 'ROSE_GOLD',
      standard: standard || 'SGK_KETNOI',
      slidesCount: slidesList.length,
      slides: slidesList,
      createdAt: now,
      updatedAt: now
    };
    this.data.decks.unshift(newDeck);
    this.save();
    return newDeck;
  }

  deleteDeck(id, userId) {
    const beforeCount = this.data.decks.length;
    this.data.decks = this.data.decks.filter(d => {
      if (d.id !== id) return true;
      if (userId && d.userId !== userId) return true;
      return false;
    });
    const deleted = this.data.decks.length < beforeCount;
    if (deleted) this.save();
    return deleted;
  }

  // --- Security Logs ---
  addSecurityLog(event) {
    const log = {
      id: `log_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      type: event.type || 'info',
      ip: event.ip || '127.0.0.1',
      details: event.details || {},
      timestamp: new Date().toISOString()
    };
    this.data.securityLogs.unshift(log);
    if (this.data.securityLogs.length > 500) {
      this.data.securityLogs.pop();
    }
    this.save();
    return log;
  }

  getSecurityLogs(limit = 50) {
    return this.data.securityLogs.slice(0, limit);
  }
}

module.exports = new Database();

