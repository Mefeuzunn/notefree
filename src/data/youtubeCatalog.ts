export interface CuratedVideo {
  id: string;
  title: string;
  channel: string;
  category: 'lofi' | 'math' | 'science' | 'coding' | 'language' | 'study';
  categoryLabel: string;
  duration: string;
  tags: string[];
}

export interface SearchCategory {
  id: 'all' | 'lofi' | 'math' | 'science' | 'coding' | 'language' | 'study';
  label: string;
  icon: string;
}

export const YOUTUBE_CATEGORIES: SearchCategory[] = [
  { id: 'all', label: 'Tümü', icon: '✨' },
  { id: 'lofi', label: 'Odak & Lo-Fi', icon: '🎧' },
  { id: 'math', label: 'Matematik', icon: '📐' },
  { id: 'science', label: 'Fizik & Bilim', icon: '⚛️' },
  { id: 'coding', label: 'Yazılım', icon: '💻' },
  { id: 'language', label: 'Yabancı Dil', icon: '🌍' },
  { id: 'study', label: 'Çalışma & Metot', icon: '📚' },
];

export const POPULAR_SEARCH_CHIPS: string[] = [
  'Lofi Girl',
  '3Blue1Brown',
  'Kalkülüs',
  'Feynman Tekniği',
  'Pomodoro 50/10',
  'Python Dersleri',
  'TYT Fizik',
  'Barış Özcan',
  'İngilizce Konuşma',
  'Kuantum Fiziği',
];

export const CURATED_VIDEOS: CuratedVideo[] = [
  // Lo-Fi & Focus
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Girl - Beats to relax/study to (7/24 Kesintisiz)',
    channel: 'Lofi Girl',
    category: 'lofi',
    categoryLabel: 'Odak & Lo-Fi',
    duration: 'Canlı 24/7',
    tags: ['lofi', 'beats', 'chill', 'study', 'relax'],
  },
  {
    id: '5yx6BWlEVcY',
    title: 'Chillhop Radio - Jazzy & Lofi Hip Hop Beats',
    channel: 'Chillhop Music',
    category: 'lofi',
    categoryLabel: 'Odak & Lo-Fi',
    duration: 'Canlı 24/7',
    tags: ['chillhop', 'jazz', 'lofi', 'focus'],
  },
  {
    id: 'WPni755-Krg',
    title: 'Derin Odaklanma & Alfa Dalgaları (Sessiz Ders Müziği)',
    channel: 'StudyMD Focus',
    category: 'lofi',
    categoryLabel: 'Odak & Lo-Fi',
    duration: '3:00:00',
    tags: ['alfa', 'brainwaves', 'study', 'deep focus'],
  },
  {
    id: 'bTqVqk7FSmY',
    title: 'Pomodoro 50/10 - Yağmur Sesi Eşliğinde Çalışma Sayacı',
    channel: 'Study Timer Hub',
    category: 'lofi',
    categoryLabel: 'Odak & Lo-Fi',
    duration: '2:00:00',
    tags: ['pomodoro', 'rain', 'timer', 'study with me'],
  },
  {
    id: '-5KAN9_CzSA',
    title: 'Sıcak Kafe Atmosferi & Hafif Caz Piyano',
    channel: 'Coffee Ambience Lab',
    category: 'lofi',
    categoryLabel: 'Odak & Lo-Fi',
    duration: '3:30:00',
    tags: ['cafe', 'jazz', 'ambient', 'piano'],
  },

  // Matematik
  {
    id: 'WUvTyaaNkzM',
    title: 'Kalkülüsün Özü: Türev ve İntegralin Görsel Mantığı',
    channel: '3Blue1Brown',
    category: 'math',
    categoryLabel: 'Matematik',
    duration: '17:04',
    tags: ['kalkülüs', 'türev', 'integral', '3blue1brown', 'matematik'],
  },
  {
    id: 'fNk_zzaMoEs',
    title: 'Lineer Cebirin Görsel Temelleri ve Vektörler',
    channel: '3Blue1Brown',
    category: 'math',
    categoryLabel: 'Matematik',
    duration: '9:52',
    tags: ['lineer cebir', 'vektör', 'matris', '3blue1brown'],
  },
  {
    id: 'v3Q1oBf5FqA',
    title: 'Limit ve Süreklilik Kavramlarına Giriş',
    channel: 'Khan Academy Türkçe',
    category: 'math',
    categoryLabel: 'Matematik',
    duration: '11:45',
    tags: ['limit', 'süreklilik', 'khan academy', 'kalkülüs'],
  },
  {
    id: 'X6_rXlZc2nI',
    title: 'Matematiğin En Güzel Denklemi: Euler Özdeşliği',
    channel: 'Barış Özcan',
    category: 'math',
    categoryLabel: 'Matematik',
    duration: '14:20',
    tags: ['euler', 'pi', 'matematik', 'barış özcan'],
  },
  {
    id: '094y1Z2wpJg',
    title: 'Dünyanın En Basit Çözülemeyen Matematik Problemi (Collatz)',
    channel: 'Veritasium',
    category: 'math',
    categoryLabel: 'Matematik',
    duration: '22:15',
    tags: ['collatz', 'sayılar teorisi', 'matematik', 'veritasium'],
  },

  // Fizik & Bilim
  {
    id: 'ZM8ECpB9650',
    title: 'Hareket ve Kinematik Yasaları - Fizik Temelleri',
    channel: 'CrashCourse',
    category: 'science',
    categoryLabel: 'Fizik & Bilim',
    duration: '10:04',
    tags: ['fizik', 'hareket', 'kinematik', 'crashcourse'],
  },
  {
    id: 'ZuvK-4j26CQ',
    title: 'Kuantum Silgisi Deneyi ve Işığın Esrarengiz Doğası',
    channel: 'Veritasium',
    category: 'science',
    categoryLabel: 'Fizik & Bilim',
    duration: '14:48',
    tags: ['kuantum', 'ışık', 'çift yarık', 'veritasium'],
  },
  {
    id: 'yq4Ucw5jW94',
    title: 'Evrenin Başlangıcı: Büyük Patlama ve Zamanın Doğuşu',
    channel: 'Kurzgesagt',
    category: 'science',
    categoryLabel: 'Fizik & Bilim',
    duration: '11:18',
    tags: ['büyük patlama', 'evren', 'zaman', 'kurzgesagt'],
  },
  {
    id: 'X4m-O0p32mI',
    title: 'James Webb Uzay Teleskobu ve İlk Galaksiler',
    channel: 'Barış Özcan',
    category: 'science',
    categoryLabel: 'Fizik & Bilim',
    duration: '16:50',
    tags: ['james webb', 'uzay', 'astronomi', 'barış özcan'],
  },

  // Yazılım & Kodlama
  {
    id: 'rfscVS0vtbw',
    title: 'Python ile Programlamaya Giriş (Sıfırdan Uzmanlığa)',
    channel: 'freeCodeCamp',
    category: 'coding',
    categoryLabel: 'Yazılım',
    duration: '4:26:52',
    tags: ['python', 'yazılım', 'programlama', 'kodlama'],
  },
  {
    id: 'jS4aFq5-91M',
    title: 'JavaScript ve Modern Web Geliştirme Temelleri',
    channel: 'freeCodeCamp',
    category: 'coding',
    categoryLabel: 'Yazılım',
    duration: '3:26:42',
    tags: ['javascript', 'frontend', 'web', 'kod'],
  },
  {
    id: '8mAITcNt710',
    title: 'Harvard CS50: Bilgisayar Bilimleri & Algoritmik Düşünce',
    channel: 'CS50',
    category: 'coding',
    categoryLabel: 'Yazılım',
    duration: '2:15:30',
    tags: ['cs50', 'harvard', 'algoritma', 'bilgisayar bilimi'],
  },
  {
    id: 'mus_vXbV4c8',
    title: 'Git ve GitHub Versiyon Kontrolü 100 Saniyede',
    channel: 'Fireship',
    category: 'coding',
    categoryLabel: 'Yazılım',
    duration: '2:22',
    tags: ['git', 'github', 'yazılım', 'versiyon kontrolü'],
  },

  // Yabancı Dil
  {
    id: 'juKd26QKNAw',
    title: 'Günlük İngilizce Konuşma Pratiği: 50 Kritik Kalıp',
    channel: 'EnglishClass101',
    category: 'language',
    categoryLabel: 'Yabancı Dil',
    duration: '35:20',
    tags: ['ingilizce', 'konuşma', 'speaking', 'vocabulary'],
  },
  {
    id: '1oX_e4aVzR8',
    title: 'BBC 6 Minute English: Kelime Bilgisi & Dinleme Egzersizi',
    channel: 'BBC Learning English',
    category: 'language',
    categoryLabel: 'Yabancı Dil',
    duration: '6:15',
    tags: ['bbc', 'english', 'listening', 'ielts'],
  },
  {
    id: 'd0yGdNEWdn0',
    title: 'Herhangi Bir Dili Hızlıca Öğrenmenin Kanıtlanmış Yolu',
    channel: 'TED-Ed',
    category: 'language',
    categoryLabel: 'Yabancı Dil',
    duration: '10:45',
    tags: ['dil öğrenme', 'polyglot', 'ted-ed', 'yabancı dil'],
  },

  // Çalışma Teknikleri & Metot
  {
    id: '_iEZkC8c-XU',
    title: 'Sınavlara Nasıl Çalışılır? Kanıta Dayalı En İyi Yöntemler',
    channel: 'Ali Abdaal',
    category: 'study',
    categoryLabel: 'Çalışma & Metot',
    duration: '20:10',
    tags: ['ders çalışma', 'feynman', 'active recall', 'sınav'],
  },
  {
    id: '1i9kZcE4Z-4',
    title: 'Ertelemeyi Bırakmak ve Saatlerce Odaklanmak',
    channel: 'Thomas Frank',
    category: 'study',
    categoryLabel: 'Çalışma & Metot',
    duration: '12:35',
    tags: ['odaklanma', 'ertelemeyi bırak', 'disiplin', 'verimlilik'],
  },
  {
    id: '_2bh8qj54F0',
    title: 'Zinciri Kırma Metodu ile Kesintisiz İlerleme',
    channel: 'Barış Özcan',
    category: 'study',
    categoryLabel: 'Çalışma & Metot',
    duration: '13:58',
    tags: ['zinciri kırma', 'alışkanlık', 'hedef', 'barış özcan'],
  },
];
