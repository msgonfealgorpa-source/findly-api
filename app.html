'use client'

import { useEffect, useState, useCallback } from 'react'

// Firebase imports
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCI_q5lkgRY4133ua4RlG5TeiCqJ5N5KTU",
  authDomain: "findly-ede17.firebaseapp.com",
  projectId: "findly-ede17",
  storageBucket: "findly-ede17.firebasestorage.app",
  messagingSenderId: "503212830017",
  appId: "1:503212830017:web:9afb64c19822bbe7f645c0",
  measurementId: "G-X1Q3WDP50N"
}

// Initialize Firebase
let app: any = null
let analytics: any = null
let auth: any = null
let provider: any = null

if (typeof window !== 'undefined') {
  app = initializeApp(firebaseConfig)
  analytics = getAnalytics(app)
  auth = getAuth(app)
  provider = new GoogleAuthProvider()
}

const API = "https://findly-api.onrender.com"

// --- All translations ---
const INVITE_TEXT: Record<string, string> = {
  ar: "ادعُ أصدقاءك الآن ✨ — ميزات ومكافآت قادمة قريبًا 🎁 — كن من الأوائل 🚀",
  en: "Invite your friends now ✨ — features & rewards coming soon 🎁 — be among the first 🚀",
  fr: "Invitez vos amis maintenant ✨ — fonctionnalités et récompenses bientôt 🎁 — soyez parmi les premiers 🚀",
  de: "Lade jetzt deine Freunde ein ✨ — neue Funktionen & Belohnungen bald 🎁 — sei unter den Ersten 🚀",
  es: "Invita a tus amigos ahora ✨ — funciones y recompensas próximamente 🎁 — sé de los primeros 🚀",
  tr: "Arkadaşlarını şimdi davet et ✨ — yakında özellikler ve ödüller 🎁 — ilklerden ol 🚀"
}

const UPGRADE_SUCCESS_TEXT: Record<string, { title: string; message: string; thanks: string; button: string }> = {
  ar: {
    title: "🎉 تم تفعيل اشتراكك بنجاح!",
    message: "تم تفعيل اشتراك Findly Pro بنجاح. يمكنك الآن الوصول إلى جميع الميزات المتقدمة والتحليلات الاحترافية بدون قيود.",
    thanks: "شكرًا لدعمك 🤍",
    button: "الانتقال إلى لوحة التحكم"
  },
  en: {
    title: "🎉 Subscription Activated!",
    message: "Your Findly Pro subscription is now active. You have full access to all premium features and advanced analysis.",
    thanks: "Thank you for supporting Findly 💙",
    button: "Go to Dashboard"
  },
  fr: {
    title: "🎉 Abonnement activé !",
    message: "Votre abonnement Findly Pro est maintenant actif.",
    thanks: "Merci pour votre soutien 💙",
    button: "Aller au tableau de bord"
  },
  de: {
    title: "🎉 Abonnement aktiviert!",
    message: "Ihr Findly Pro-Abonnement ist jetzt aktiv.",
    thanks: "Danke für Ihre Unterstützung 💙",
    button: "Zum Dashboard"
  },
  es: {
    title: "🎉 Suscripción activada!",
    message: "Tu suscripción Findly Pro ya está activa.",
    thanks: "Gracias por tu apoyo 💙",
    button: "Ir al panel"
  },
  tr: {
    title: "🎉 Abonelik etkinleştirildi!",
    message: "Findly Pro aboneliğiniz artık aktif.",
    thanks: "Desteğiniz için teşekkürler 💙",
    button: "Kontrol paneline git"
  }
}

const i18n: Record<string, { title: string; message: string; upgrade: string }> = {
  ar: {
    title: 'انتهت المحاولات المجانية',
    message: 'لقد استهلكت جميع عمليات البحث المجانية. يرجى تفعيل الاشتراك للمتابعة بدون حدود.',
    upgrade: 'ترقية الآن'
  },
  en: {
    title: 'Free searches exhausted',
    message: 'You have used all your free searches. Please upgrade your plan to continue.',
    upgrade: 'Upgrade now'
  }
}

const dict: Record<string, any> = {
  ar: {
    ui: {
      title: "مستشارك الحكيم", sub: "دليلك الذكي للتسوق المثالي", energy: "طاقة العقل", welcome: "مرحباً،",
      game: "ألعاب", beauty: "جمال", home: "منزل ذكي", c1: "هواتف", c2: "لابتوب", c4: "ساعات",
      p_head: "الملف الشخصي", lbl_name: "اسم المستخدم", lbl_budget: "الميزانية ($)",
      buy: "شراء الآن 🛒", watch: "راقب السعر 🔔", over: "يتجاوز ميزانيتك",
      cheap: "اقتصادي", top: "الأعلى تقييماً", new: "حديث جداً", deep: "وضع التحليل الذكي",
      watchTitle: "قائمة المراقبة", why: "لماذا اخترنا هذا؟", slow: "السيرفر يستيقظ.. انتظر ثوانٍ",
      noAttempts: "⚠️ استنفدت محاولاتك!", analyze: "📊 تحليل السعر"
    },
    search: {
      market: "السوق", avg_price: "متوسط السعر", competitors: "عدد المنافسين", value: "قيمة الصفقة",
      deal_score: "تقييم الصفقة", learning_on: "سيتحسن التحليل مع الاستخدام", learning_later: "التحليل قيد التعلم",
      forecast: "التوقع السعري", trend: { up: "قد يرتفع قريبًا", down: "قد ينخفض", stable: "مستقر" },
      expected_price: "السعر المتوقع", confidence: "الثقة", trust: "الثقة والمخاطر", no_risks: "لا توجد مخاطر واضحة",
      buy: "اشترِ", analyze: "تحليل", watch: "راقب", after_discount: "بعد الخصم", copy_coupon: "نسخ الكوبون"
    }
  },
  en: {
    ui: {
      title: "Sage Advisor", sub: "Your smart shopping guide", energy: "Sage Energy", welcome: "Welcome,",
      game: "Gaming", beauty: "Beauty", home: "Smart Home", c1: "Phones", c2: "Laptops", c4: "Watches",
      p_head: "Profile", lbl_name: "Username", lbl_budget: "Budget ($)",
      buy: "Buy Now 🛒", watch: "Watch Price 🔔", over: "Over Budget!",
      cheap: "Budget", top: "Top Rated", new: "Newest", deep: "AI Deep Mode",
      watchTitle: "Watch List", why: "Why this choice?", slow: "Server waking up.. wait",
      noAttempts: "⚠️ No attempts left!", analyze: "📊 Analysis"
    },
    search: {
      market: "Market", avg_price: "Average price", competitors: "Competitors", value: "Deal value",
      deal_score: "Deal score", learning_on: "Analysis improves with usage", learning_later: "Analysis is learning",
      forecast: "Price forecast", trend: { up: "Likely to rise", down: "Likely to drop", stable: "Stable" },
      expected_price: "Expected price", confidence: "Confidence", trust: "Trust & risks", no_risks: "No clear risks",
      buy: "Buy", analyze: "Analyze", watch: "Watch", after_discount: "After discount", copy_coupon: "Copy coupon"
    }
  },
  fr: {
    ui: {
      title: "Conseiller Sage", sub: "Votre guide d'achat intelligent", energy: "Énergie Sage", welcome: "Bienvenue,",
      game: "Jeux", beauty: "Beauté", home: "Maison Intelligente", c1: "Téléphones", c2: "Ordinateurs", c4: "Montres",
      p_head: "Profil", lbl_name: "Nom d'utilisateur", lbl_budget: "Budget ($)",
      buy: "Acheter 🛒", watch: "Surveiller 🔔", over: "Hors budget!",
      cheap: "Économique", top: "Mieux notés", new: "Nouveautés", deep: "Mode IA Profonde",
      watchTitle: "Liste de surveillance", why: "Pourquoi ce choix?", slow: "Le serveur se réveille..",
      noAttempts: "⚠️ Plus d'essais!", analyze: "📊 Analyse"
    },
    search: {
      market: "Marché", avg_price: "Prix moyen", competitors: "Concurrents", value: "Valeur de l'offre",
      deal_score: "Score de l'offre", learning_on: "L'analyse s'améliore", learning_later: "Analyse en cours",
      forecast: "Prévision de prix", trend: { up: "Probablement hausse", down: "Probablement baisse", stable: "Stable" },
      expected_price: "Prix attendu", confidence: "Confiance", trust: "Confiance et risques", no_risks: "Aucun risque clair",
      buy: "Acheter", analyze: "Analyser", watch: "Surveiller", after_discount: "Après remise", copy_coupon: "Copier le coupon"
    }
  },
  de: {
    ui: {
      title: "Weiser Berater", sub: "Ihr intelligenter Einkaufsführer", energy: "Sage Energie", welcome: "Willkommen,",
      game: "Spiele", beauty: "Schönheit", home: "Smart Home", c1: "Handys", c2: "Laptops", c4: "Uhren",
      p_head: "Profil", lbl_name: "Benutzername", lbl_budget: "Budget ($)",
      buy: "Jetzt kaufen 🛒", watch: "Preis beobachten 🔔", over: "Über Budget!",
      cheap: "Budget", top: "Top bewertet", new: "Neueste", deep: "KI Tiefenmodus",
      watchTitle: "Beobachtungsliste", why: "Warum diese Wahl?", slow: "Server startet..",
      noAttempts: "⚠️ Keine Versuche mehr!", analyze: "📊 Analyse"
    },
    search: {
      market: "Markt", avg_price: "Durchschnittspreis", competitors: "Wettbewerber", value: "Angebotswert",
      deal_score: "Angebotsbewertung", learning_on: "Analyse verbessert sich", learning_later: "Analyse lernt",
      forecast: "Preisprognose", trend: { up: "Wahrscheinlich steigend", down: "Wahrscheinlich fallend", stable: "Stabil" },
      expected_price: "Erwarteter Preis", confidence: "Vertrauen", trust: "Vertrauen & Risiken", no_risks: "Keine klaren Risiken",
      buy: "Kaufen", analyze: "Analysieren", watch: "Beobachten", after_discount: "Nach Rabatt", copy_coupon: "Gutschein kopieren"
    }
  },
  es: {
    ui: {
      title: "Consejero Sabio", sub: "Tu guía de compras inteligente", energy: "Energía Sage", welcome: "Bienvenido,",
      game: "Juegos", beauty: "Belleza", home: "Hogar Inteligente", c1: "Teléfonos", c2: "Laptops", c4: "Relojes",
      p_head: "Perfil", lbl_name: "Nombre de usuario", lbl_budget: "Presupuesto ($)",
      buy: "Comprar ahora 🛒", watch: "Vigilar precio 🔔", over: "¡Fuera de presupuesto!",
      cheap: "Económico", top: "Mejor valorados", new: "Más nuevos", deep: "Modo IA Profundo",
      watchTitle: "Lista de seguimiento", why: "¿Por qué esta elección?", slow: "El servidor se está despertando..",
      noAttempts: "⚠️ ¡No quedan intentos!", analyze: "📊 Análisis"
    },
    search: {
      market: "Mercado", avg_price: "Precio promedio", competitors: "Competidores", value: "Valor de oferta",
      deal_score: "Puntuación de oferta", learning_on: "El análisis mejora con el uso", learning_later: "Análisis aprendiendo",
      forecast: "Pronóstico de precios", trend: { up: "Probable subida", down: "Probable bajada", stable: "Estable" },
      expected_price: "Precio esperado", confidence: "Confianza", trust: "Confianza y riesgos", no_risks: "Sin riesgos claros",
      buy: "Comprar", analyze: "Analizar", watch: "Vigilar", after_discount: "Después del descuento", copy_coupon: "Copiar cupón"
    }
  },
  tr: {
    ui: {
      title: "Bilge Danışman", sub: "Akıllı alışveriş rehberiniz", energy: "Sage Enerjisi", welcome: "Hoş geldiniz,",
      game: "Oyunlar", beauty: "Güzellik", home: "Akıllı Ev", c1: "Telefonlar", c2: "Laptoplar", c4: "Saatler",
      p_head: "Profil", lbl_name: "Kullanıcı adı", lbl_budget: "Bütçe ($)",
      buy: "Şimdi al 🛒", watch: "Fiyatı izle 🔔", over: "Bütçeyi aşıyor!",
      cheap: "Ekonomik", top: "En çok oylanan", new: "En yeniler", deep: "YA Derin Modu",
      watchTitle: "İzleme listesi", why: "Neden bu seçim?", slow: "Sunucu uyanıyor..",
      noAttempts: "⚠️ Deneme hakkı kalmadı!", analyze: "📊 Analiz"
    },
    search: {
      market: "Pazar", avg_price: "Ortalama fiyat", competitors: "Rakipler", value: "Teklif değeri",
      deal_score: "Teklif puanı", learning_on: "Analiz kullanımla gelişir", learning_later: "Analiz öğreniyor",
      forecast: "Fiyat tahmini", trend: { up: "Muhtemelen artacak", down: "Muhtemelen düşecek", stable: "Kararlı" },
      expected_price: "Beklenen fiyat", confidence: "Güven", trust: "Güven ve riskler", no_risks: "Açık risk yok",
      buy: "Satın al", analyze: "Analiz et", watch: "İzle", after_discount: "İndirim sonrası", copy_coupon: "Kuponu kopyala"
    }
  }
}

// Types
interface ProductResult {
  title: string
  price: string | number
  thumbnail?: string
  image?: string
  link?: string
  coupons?: Array<{ code: string; type: string; discount: number }>
  intelligence?: {
    finalVerdict?: {
      decision?: string
      title?: string
      reason?: string
      emoji?: string
      bestLink?: string
      bestStore?: string
      bestPrice?: number
      savingPercent?: number
      confidence?: number
    }
    priceIntel?: {
      score?: number
      average?: number
      label?: string
      decision?: string
    }
    valueIntel?: {
      score?: number
      competitors?: number
      learningBoost?: number
    }
    forecastIntel?: {
      trend?: string
      expectedPrice?: number
      confidence?: number
    }
    trustIntel?: {
      riskScore?: number
      warnings?: string[]
    }
    personalityIntel?: {
      type?: string
    }
  }
}

interface AnalysisData {
  verdict: any
  priceIntel: any
  valueIntel: any
  forecastIntel: any
  trustIntel: any
}

export default function Home() {
  // Helper function to get localStorage value safely
  const getLocalStorage = (key: string, defaultValue: string) => {
    if (typeof window === 'undefined') return defaultValue
    return localStorage.getItem(key) || defaultValue
  }

  // State with lazy initialization from localStorage
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(true)
  const [lang, setLang] = useState(() => getLocalStorage('findly_lang', 'ar'))
  const [attempts, setAttempts] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('findly_attempts') : null
    return saved ? parseInt(saved) : 3
  })
  const [lightMode, setLightMode] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState('')
  const [results, setResults] = useState<ProductResult[]>([])
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showWatchModal, setShowWatchModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [userName, setUserName] = useState(() => getLocalStorage('fn', ''))
  const [userBudget, setUserBudget] = useState(() => getLocalStorage('user_budget', ''))
  const [watchList, setWatchList] = useState<any[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('findly_watch') : null
    return saved ? JSON.parse(saved) : []
  })
  const [affiliateProduct, setAffiliateProduct] = useState<ProductResult | null>(null)
  const [aiDeepMode, setAiDeepMode] = useState(false)
  const [micActive, setMicActive] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')

  // Get translations
  const T = dict[lang]?.search || dict.en.search
  const UI = dict[lang]?.ui || dict.en.ui

  // Initialize localStorage defaults
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('findly_attempts')) {
        localStorage.setItem('findly_attempts', '3')
      }
    }
  }, [])

  // Firebase auth state listener
  useEffect(() => {
    if (!auth) return
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        setShowAuth(false)
        localStorage.setItem('findly_uid', firebaseUser.uid)
      } else {
        setUser(null)
        setShowAuth(true)
      }
    })

    return () => unsubscribe()
  }, [])

  // Check for upgrade success
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.href.includes('upgrade-success')) {
      localStorage.setItem('findly_pro', 'true')
      alert(UPGRADE_SUCCESS_TEXT[lang]?.title || UPGRADE_SUCCESS_TEXT.ar.title)
    }
  }, [lang])

  // Auth handlers
  const loginWithGoogle = async () => {
    if (!auth || !provider) return
    try {
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      alert("Error: " + error.message)
    }
  }

  const handleLogin = async () => {
    if (!auth) return
    if (!authEmail || !authPassword) {
      alert(lang === 'ar' ? "الرجاء إدخال البريد الإلكتروني وكلمة المرور" : "Please enter email and password")
      return
    }

    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword)
    } catch (error: any) {
      let msg = lang === 'ar' ? "فشل تسجيل الدخول: " : "Login failed: "
      if (error.code === 'auth/user-not-found') msg = lang === 'ar' ? "هذا الحساب غير موجود، يرجى إنشاء حساب جديد." : "Account not found, please register."
      else if (error.code === 'auth/wrong-password') msg = lang === 'ar' ? "كلمة المرور غير صحيحة." : "Incorrect password."
      else if (error.code === 'auth/invalid-email') msg = lang === 'ar' ? "صيغة البريد الإلكتروني غير صحيحة." : "Invalid email format."
      else if (error.code === 'auth/invalid-credential') msg = lang === 'ar' ? "بيانات الاعتماد غير صالحة." : "Invalid credentials."
      else msg += error.message
      alert(msg)
    }
  }

  const handleRegister = async () => {
    if (!auth) return
    if (!authEmail || !authPassword) {
      alert(lang === 'ar' ? "الرجاء إدخال البريد الإلكتروني وكلمة المرور" : "Please enter email and password")
      return
    }
    if (authPassword.length < 6) {
      alert(lang === 'ar' ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters")
      return
    }

    try {
      await createUserWithEmailAndPassword(auth, authEmail, authPassword)
      alert(lang === 'ar' ? "تم إنشاء الحساب بنجاح!" : "Account created successfully!")
    } catch (error: any) {
      let msg = lang === 'ar' ? "فشل إنشاء الحساب: " : "Registration failed: "
      if (error.code === 'auth/email-already-in-use') msg = lang === 'ar' ? "هذا البريد مسجل بالفعل، حاول تسجيل الدخول." : "Email already registered, try logging in."
      else if (error.code === 'auth/weak-password') msg = lang === 'ar' ? "كلمة المرور ضعيفة جداً." : "Password is too weak."
      else if (error.code === 'auth/invalid-email') msg = lang === 'ar' ? "صيغة البريد الإلكتروني غير صحيحة." : "Invalid email format."
      else msg += error.message
      alert(msg)
    }
  }

  const logoutUser = () => {
    if (!auth) return
    if (confirm(lang === 'ar' ? "هل تريد تسجيل الخروج؟" : "Logout?")) {
      signOut(auth).then(() => {
        localStorage.removeItem('findly_uid')
        window.location.reload()
      })
    }
  }

  // Helper functions
  const applyCoupon = (price: number, coupon: any) => {
    if (!price || !coupon) return price
    let final = price
    if (coupon.type === 'percent') {
      final = price - (price * coupon.discount / 100)
    }
    if (coupon.type === 'fixed') {
      final = price - coupon.discount
    }
    return Math.max(final, 0).toFixed(2)
  }

  const pickBestCoupon = (price: number, coupons: any[] = []) => {
    if (!price || !coupons.length) return null
    let best: any = null
    let bestPrice = price
    coupons.forEach(c => {
      const discounted = parseFloat(applyCoupon(price, c))
      if (discounted < bestPrice) {
        bestPrice = discounted
        best = c
      }
    })
    return best
  }

  // Search function
  const runSearch = async () => {
    const q = searchInput.trim()
    if (!q) return

    setStatus('🔍 ...')
    setResults([])
    const budget = parseFloat(userBudget) || 0

    try {
      const uid = localStorage.getItem('findly_uid') || 'guest'
      const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&lang=${lang}&uid=${uid}`)
      const data = await res.json()

      if (data.error === 'ENERGY_EMPTY') {
        const t = i18n[lang] || i18n.ar
        setStatus(`ENERGY_EMPTY:${t.title}:${t.message}:${t.upgrade}`)
        return
      }

      if (!data.results) {
        setStatus(lang === 'ar' ? 'لا توجد نتائج' : 'No results found')
        return
      }

      setStatus('')
      setResults(data.results)

      if (data.results.length > 0) {
        setAffiliateProduct(data.results[0])
      }
    } catch (e) {
      console.error(e)
      setStatus('❌ Error fetching results')
    }
  }

  // Watch list functions
  const addToWatch = async (name: string, price: string, link: string) => {
    const userEmail = prompt(lang === 'ar' ? "أدخل إيميلك للتنبيه عند انخفاض السعر:" : "Enter email for price alerts:")
    if (!userEmail || !userEmail.includes("@")) return

    const uid = localStorage.getItem('findly_uid') || 'guest'
    const numericPrice = parseFloat(String(price).replace(/[^\d.]/g, '')) || 0
    const targetPrice = numericPrice * 0.9

    try {
      const response = await fetch(`${API}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          productName: name,
          targetPrice: targetPrice,
          currentPrice: numericPrice,
          productLink: link,
          lang: lang,
          uid: uid
        })
      })
      if (response.ok) {
        alert(lang === 'ar' ? "✅ تم تفعيل التنبيه بنجاح!" : "✅ Alert activated!")
      } else {
        alert("❌ Server Error: " + response.status)
      }
    } catch (error) {
      alert("❌ Connection failed")
    }
  }

  // Profile save
  const saveSettings = () => {
    localStorage.setItem('fn', userName)
    localStorage.setItem('user_budget', userBudget)
    setShowProfileModal(false)
  }

  // Copy invite
  const copyInvite = () => {
    const uid = localStorage.getItem('findly_uid') || 'guest'
    const link = `${window.location.origin}?ref=${uid}`
    navigator.clipboard.writeText(link).then(() => {
      alert(lang === 'ar' ? 'تم نسخ رابط الدعوة ✨' : 'Invite link copied ✨')
    }).catch(() => {
      alert(link)
    })
  }

  // Voice search
  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert(lang === 'ar' ? "متصفحك لا يدعم البحث الصوتي" : "Speech recognition not supported")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'ar' ? 'ar-SA' : 'en-US'
    recognition.interimResults = false

    recognition.onstart = () => setMicActive(true)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setSearchInput(transcript)
      setMicActive(false)
      runSearch()
    }
    recognition.onerror = () => setMicActive(false)
    recognition.onend = () => setMicActive(false)
    recognition.start()
  }

  // Open upgrade
  const openUpgrade = async () => {
    const uid = localStorage.getItem('findly_uid') || 'guest_' + Date.now()
    try {
      const res = await fetch(`${API}/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      })
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      } else {
        alert("⚠️ Payment unavailable, try again later")
      }
    } catch (e) {
      alert("❌ Payment service error")
    }
  }

  // Set language
  const setLanguage = (l: string) => {
    setLang(l)
    localStorage.setItem('findly_lang', l)
    setShowLangMenu(false)
  }

  // Quick search
  const quickSearch = (q: string) => {
    setSearchInput(q)
    setTimeout(() => runSearch(), 100)
  }

  // Quick filter
  const quickFilter = (type: string) => {
    setSearchInput(prev => prev + ' ' + type)
  }

  // Open analysis
  const openAnalysis = (data: AnalysisData) => {
    setAnalysisData(data)
    setShowAnalysisModal(true)
  }

  // Toggle mode
  const toggleMode = () => setLightMode(!lightMode)

  // Get display name
  const displayName = userName || (lang === 'ar' ? 'أيها الباحث' : 'Seeker')

  // Render product card
  const renderProductCard = (p: ProductResult, index: number) => {
    const intel = p.intelligence || {}
    const verdict = intel.finalVerdict || {}
    const priceIntel = intel.priceIntel || {}
    const valueIntel = intel.valueIntel || {}
    const forecast = intel.forecastIntel || {}
    const trust = intel.trustIntel || {}

    // Strategic verdict
    let strategicBadge = ''
    let strategicColor = '#3b82f6'
    if (verdict.decision === 'BUY_NOW') {
      strategicBadge = '🟢 قرار ذكي: اشترِ الآن'
      strategicColor = '#10b981'
    } else if (verdict.decision === 'WAIT') {
      strategicBadge = '⏳ يفضل الانتظار'
      strategicColor = '#f59e0b'
    } else if (verdict.decision === 'WAIT_PRICE_DROP') {
      strategicBadge = '📉 انتظر انخفاض السعر'
      strategicColor = '#6366f1'
    } else if (verdict.decision === 'OVERPRICED') {
      strategicBadge = '🔴 السعر مرتفع'
      strategicColor = '#ef4444'
    }

    const bestLink = verdict.bestLink || p.link
    const safeLink = typeof bestLink === 'string' && bestLink?.startsWith('http') ? bestLink : null

    // Budget logic
    const priceVal = parseFloat(String(p.price).replace(/[^\d.]/g, '')) || 0
    const budgetNum = parseFloat(userBudget) || 0
    const isOverBudget = budgetNum > 0 && priceVal > budgetNum

    // Coupon logic
    const coupons = p.coupons || []
    const numericPrice = priceVal
    const bestCoupon = (numericPrice && coupons.length) ? pickBestCoupon(numericPrice, coupons) : null
    const discountedPrice = (numericPrice && bestCoupon) ? applyCoupon(numericPrice, bestCoupon) : null

    return (
      <div key={index} className={`product-card ${isOverBudget ? 'over-budget' : ''}`}>
        {isOverBudget && <div className="budget-alert">⚠️ {UI.over}</div>}
        
        <img src={p.thumbnail || ''} alt={p.title || ''} onError={(e) => {(e.target as HTMLImageElement).src = 'https://via.placeholder.com/200'}} />
        
        <h3>{p.title || '—'}</h3>
        
        <div className="price">
          {bestCoupon && discountedPrice ? (
            <>
              <span className="old-price">${numericPrice}</span>
              <span className="new-price">${discountedPrice}</span>
            </>
          ) : `$${numericPrice || '-'}`}
        </div>

        <div className="sage-quick-brains">
          <div className="brain-item good">
            💰 {lang === 'ar' ? 'السعر' : 'Price'} <span>{priceIntel.score >= 70 ? (lang === 'ar' ? 'ممتاز' : 'Excellent') : priceIntel.score >= 50 ? (lang === 'ar' ? 'جيد' : 'Good') : (lang === 'ar' ? 'ضعيف' : 'Weak')}</span>
          </div>
          <div className={`brain-item ${forecast.trend === 'down' ? 'wait' : forecast.trend === 'up' ? 'buy' : 'neutral'}`}>
            📈 {lang === 'ar' ? 'التوقيت' : 'Timing'} <span>{forecast.trend === 'down' ? (lang === 'ar' ? 'انتظر' : 'Wait') : forecast.trend === 'up' ? (lang === 'ar' ? 'قد يرتفع' : 'May rise') : (lang === 'ar' ? 'مستقر' : 'Stable')}</span>
          </div>
          <div className={`brain-item ${(trust.riskScore || 0) > 50 ? 'risk' : 'safe'}`}>
            🛡️ {lang === 'ar' ? 'الثقة' : 'Trust'} <span>{(trust.riskScore || 0) > 50 ? (lang === 'ar' ? 'مخاطرة' : 'Risk') : (lang === 'ar' ? 'آمن' : 'Safe')}</span>
          </div>
          <div className="brain-item learn">
            🧠 {lang === 'ar' ? 'السلوك' : 'Behavior'} <span>{(valueIntel.learningBoost || 0) > 0 ? (lang === 'ar' ? 'مناسب لك' : 'Suitable') : (lang === 'ar' ? 'عام' : 'General')}</span>
          </div>
        </div>

        <div className="analysis-engine">
          <span className="analysis-label">{verdict.emoji || '🤖'} {verdict.title || ''}</span>
          <div>{verdict.reason || ''}</div>
        </div>

        {verdict.decision && (
          <div style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${strategicColor}` }}>
            <div style={{ fontWeight: 'bold', color: strategicColor, marginBottom: '6px' }}>
              {strategicBadge}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{verdict.reason || ''}</div>
            {verdict.savingPercent && <div style={{ marginTop: '5px' }}>💰 {lang === 'ar' ? 'التوفير' : 'Saving'}: <strong>{verdict.savingPercent}%</strong></div>}
            {verdict.bestStore && <div style={{ marginTop: '5px' }}>🏪 {lang === 'ar' ? 'أفضل متجر' : 'Best store'}: <strong>{verdict.bestStore}</strong> {verdict.bestPrice ? ` - $${verdict.bestPrice}` : ''}</div>}
            <div style={{ marginTop: '5px' }}>🎯 {lang === 'ar' ? 'الثقة' : 'Confidence'}: <strong>{verdict.confidence || 0}%</strong></div>
          </div>
        )}

        {bestCoupon && (
          <div className="coupon-box" style={{ margin: '10px 0', padding: '10px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', border: '1px dashed #10b981' }}>
            🎟️ <strong>{bestCoupon.code}</strong> ({bestCoupon.type === 'percent' ? `-${bestCoupon.discount}%` : `-$${bestCoupon.discount}`})
            <div className="discounted-price" style={{ fontSize: '0.9rem', marginTop: '5px' }}>
              {T.after_discount}: <strong>${discountedPrice}</strong>
            </div>
            <button className="action-btn" onClick={() => navigator.clipboard.writeText(bestCoupon.code)} style={{ background: '#10b981', color: 'white', padding: '5px 10px', fontSize: '0.8rem', marginTop: '5px' }}>
              {T.copy_coupon}
            </button>
          </div>
        )}

        <div className="intel-section">
          <h4>📊 {T.market}</h4>
          <p>{T.avg_price}: <strong>{priceIntel.average ? `$${priceIntel.average}` : '—'}</strong></p>
          <p>{T.competitors}: <strong>{valueIntel.competitors || 0}</strong></p>
        </div>

        <div className="intel-section">
          <h4>💎 {T.value}</h4>
          <p>{T.deal_score}: <strong>{valueIntel.score || 0}%</strong></p>
          <p>{valueIntel.learningBoost > 0 ? T.learning_on : T.learning_later}</p>
        </div>

        <div className="intel-section">
          <h4>🔮 {T.forecast}</h4>
          <p>{T.trend[forecast.trend] || T.trend.stable}</p>
          <p>{T.expected_price}: <strong>${forecast.expectedPrice || '—'}</strong></p>
          <p>{T.confidence}: <strong>{Math.round((forecast.confidence || 0) * 100)}%</strong></p>
        </div>

        <div className="intel-section">
          <h4>⚠️ {T.trust}</h4>
          {trust.warnings && trust.warnings.length ? (
            <ul>{trust.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>
          ) : <p>✅ {T.no_risks}</p>}
        </div>

        <button className="action-btn watch" onClick={() => addToWatch(p.title || '', String(numericPrice), safeLink || '')} style={{ width: '100%', marginTop: '10px', background: '#f59e0b', color: 'white' }}>
          🔔 {lang === 'ar' ? 'مراقبة السعر' : 'Watch Price'}
        </button>

        <div className="btn-group" style={{ marginTop: '15px' }}>
          {safeLink ? (
            <a className="action-btn buy-now" href={`https://findly-api.onrender.com/go?url=${encodeURIComponent(safeLink)}`} target="_blank" rel="noopener noreferrer">
              {T.buy}
            </a>
          ) : (
            <button className="action-btn buy-now disabled" disabled>
              {lang === 'ar' ? 'الرابط غير متوفر' : 'Link unavailable'}
            </button>
          )}
        </div>

        <button className="action-btn analyze-btn" style={{ width: '100%', marginTop: '10px' }} onClick={() => openAnalysis({ verdict, priceIntel, valueIntel, forecastIntel: forecast, trustIntel: trust })}>
          {T.analyze}
        </button>
      </div>
    )
  }

  return (
    <div className={lightMode ? 'light-mode' : ''} style={{ minHeight: '100vh' }}>
      <style jsx global>{`
        /* --- Core Variables & Reset --- */
        :root {
          --primary: #8b5cf6;
          --primary-glow: rgba(139, 92, 246, 0.5);
          --secondary: #6366f1;
          --bg-dark: #020617;
          --bg-card: rgba(30, 41, 59, 0.7);
          --glass-border: rgba(255, 255, 255, 0.08);
          --text: #f8fafc;
          --text-muted: #94a3b8;
          --gradient: linear-gradient(135deg, #6366F1, #A855F7);
        }
        .light-mode {
          --bg-dark: #f8fafc;
          --bg-card: rgba(255, 255, 255, 0.9);
          --glass-border: rgba(0, 0, 0, 0.05);
          --text: #1e293b;
          --text-muted: #64748b;
        }

        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; outline: none; }

        body {
          background-color: var(--bg-dark);
          background-image: radial-gradient(circle at 50% 0%, #1e1b4b 0%, transparent 50%);
          color: var(--text);
          font-family: 'Readex Pro', 'Segoe UI', sans-serif;
          margin: 0;
          transition: background 0.4s ease, color 0.4s ease;
          overflow-x: hidden;
          min-height: 100vh;
        }

        /* Header Styles */
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 5%;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--glass-border);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 800;
          background: var(--gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }

        .tagline {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .header-tools { display: flex; gap: 10px; align-items: center; }

        .tool-btn {
          background: var(--bg-card);
          border: 1px solid var(--glass-border);
          color: var(--text);
          width: 42px;
          height: 42px;
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .tool-btn:hover {
          transform: translateY(-2px);
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        /* Dropdown Menu */
        .lang-menu {
          position: absolute;
          top: 50px;
          left: 0;
          background: #1e293b;
          border-radius: 16px;
          border: 1px solid var(--glass-border);
          width: 140px;
          z-index: 2000;
          box-shadow: 0 20px 40px -5px rgba(0,0,0,0.4);
          overflow: hidden;
        }

        .lang-item {
          padding: 12px;
          font-size: 0.9rem;
          cursor: pointer;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          color: #e2e8f0;
          text-align: center;
          transition: 0.2s;
        }

        .lang-item:hover { background: var(--primary); color: white; }

        /* Main Search Area */
        .search-area {
          padding: 40px 5%;
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }

        .energy-box {
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(168, 85, 247, 0.3);
          padding: 8px 20px;
          border-radius: 50px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 25px;
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.1);
        }

        h1.page-title {
          background: linear-gradient(to right, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 10px 0;
          font-size: 2.5rem;
          letter-spacing: -1px;
        }

        .light-mode h1.page-title {
          background: linear-gradient(to right, #1e293b, #475569);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .ai-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.9rem;
          color: var(--primary);
          margin-bottom: 25px;
          justify-content: center;
          font-weight: 600;
          background: rgba(139, 92, 246, 0.05);
          padding: 8px 16px;
          border-radius: 12px;
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
        }

        .ai-toggle input { width: 20px; height: 20px; accent-color: var(--primary); cursor: pointer; }

        /* Search Input Styling */
        .search-wrapper { position: relative; max-width: 600px; margin: 0 auto 20px; }

        .search-input {
          width: 100%;
          padding: 18px 60px;
          border-radius: 24px;
          border: 2px solid var(--glass-border);
          background: var(--bg-card);
          color: var(--text);
          font-size: 1.1rem;
          backdrop-filter: blur(10px);
          transition: all 0.3s;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          font-family: inherit;
        }

        .search-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
        }

        .mic-icon {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--secondary);
          cursor: pointer;
          font-size: 1.4rem;
          transition: 0.3s;
          z-index: 10;
        }

        .mic-active { color: #ef4444; text-shadow: 0 0 10px #ef4444; animation: pulse 1s infinite; }

        .send-btn {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: var(--gradient);
          border: none;
          width: 45px;
          height: 45px;
          border-radius: 18px;
          color: #fff;
          cursor: pointer;
          transition: 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .send-btn:hover { transform: translateY(-50%) scale(1.05); box-shadow: 0 0 15px var(--primary-glow); }

        /* Tags & Categories */
        .ai-options { display: flex; justify-content: center; gap: 10px; margin-top: 10px; flex-wrap: wrap; }

        .ai-tag {
          font-size: 0.8rem; padding: 8px 16px; border-radius: 20px;
          background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border);
          cursor: pointer; color: var(--text-muted); display: flex; align-items: center; gap: 8px;
          transition: 0.3s;
        }

        .ai-tag:hover { background: var(--bg-card); color: var(--primary); border-color: var(--primary); }

        .cat-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
          max-width: 600px; margin: 30px auto;
        }

        .cat-card {
          background: var(--bg-card); border: 1px solid var(--glass-border);
          padding: 15px 10px; border-radius: 20px; cursor: pointer;
          transition: 0.3s; display: flex; flex-direction: column; align-items: center; gap: 8px;
        }

        .cat-card:hover { transform: translateY(-5px); background: rgba(255,255,255,0.05); border-color: var(--primary); }
        .cat-card i { font-size: 1.5rem; color: var(--secondary); }
        .cat-card span { font-size: 0.75rem; font-weight: 600; }

        /* Product Cards (Results) */
        .product-card {
          background: var(--bg-card);
          border: 1px solid var(--glass-border);
          border-radius: 24px;
          padding: 20px;
          margin-top: 25px;
          text-align: right;
          max-width: 600px;
          margin-left: auto; margin-right: auto;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px);
          animation: slideUp 0.5s ease;
        }

        .product-card img {
          width: 100%; height: 200px; object-fit: contain;
          background: #fff; border-radius: 16px; margin-bottom: 15px;
          padding: 10px;
        }

        .product-card h3 { margin: 0 0 10px 0; font-size: 1.1rem; line-height: 1.5; color: var(--text); }
        .product-card .price { font-size: 1.4rem; font-weight: 800; color: #10b981; margin-bottom: 10px; }

        .over-budget { border: 2px solid #ff4d4d !important; background-color: rgba(255, 77, 77, 0.05) !important; }
        .budget-alert { background: #ff4d4d; color: white; padding: 4px 10px; border-radius: 8px; font-size: 0.8rem; margin-bottom: 10px; display: inline-block; font-weight: bold; }

        .analysis-engine {
          background: rgba(99, 102, 241, 0.08);
          border-right: 3px solid var(--primary);
          padding: 12px; border-radius: 12px; margin: 15px 0;
          font-size: 0.85rem; line-height: 1.6; color: var(--text-muted);
        }

        .analysis-label { font-weight: 700; color: var(--primary); display: block; margin-bottom: 5px; }

        .btn-group { display: flex; gap: 12px; margin-top: 15px; flex-wrap: wrap; }

        .action-btn {
          flex: 1; padding: 12px; border-radius: 14px; font-weight: 700;
          text-align: center; border: none; font-size: 0.9rem; cursor: pointer;
          transition: 0.3s;
        }

        .buy-now { background: var(--gradient); color: #fff; text-decoration: none; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3); display: flex; justify-content: center; align-items: center;}
        .buy-now:hover { filter: brightness(1.1); }

        .analyze-btn {
          background: rgba(30, 41, 59, 0.7); border: 1px solid var(--primary); color: var(--primary);
        }
        .analyze-btn:hover { background: var(--primary); color: white; }

        .watch-btn {
          background: transparent; border: 1px solid var(--text-muted); color: var(--text);
        }
        .watch-btn:hover { background: rgba(139, 92, 246, 0.1); border-color: var(--primary); }

        /* Modals */
        .modal {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.8);
          z-index: 3000;
          display: flex;
          align-items: center; justify-content: center;
          backdrop-filter: blur(12px);
        }

        .modal-box {
          background: #0f172a; padding: 30px; border-radius: 30px;
          width: 85%; max-width: 400px;
          border: 1px solid var(--glass-border);
          text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          color: white;
        }

        .modal-box input {
          width: 100%; padding: 14px; margin: 10px 0; border-radius: 14px;
          background: #1e293b; color: #fff; border: 1px solid var(--glass-border);
          text-align: center; font-family: inherit;
        }

        .modal-box input:focus { border-color: var(--primary); }

        /* Auth Overlay */
        .auth-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: radial-gradient(circle at center, #1e1b4b 0%, #020617 100%) !important;
          z-index: 2147483647 !important;
          display: flex;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(15px);
          overflow: hidden;
          touch-action: none;
        }

        .auth-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 92, 246, 0.3);
          padding: 40px;
          border-radius: 28px;
          width: 90%;
          max-width: 420px;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.2);
        }

        .auth-header h1 {
          font-size: 2.2rem;
          color: #fff;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .auth-header span {
          color: #a78bfa;
          text-shadow: 0 0 15px rgba(167, 139, 250, 0.5);
        }

        .s-input {
          width: 100%;
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          color: white !important;
          padding: 14px 20px !important;
          border-radius: 14px !important;
          margin-bottom: 15px;
          transition: 0.3s;
          font-family: inherit;
        }

        .s-input:focus {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.3) !important;
        }

        .google-btn {
          background: white;
          color: #1e293b;
          width: 100%;
          padding: 12px;
          border-radius: 14px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.3s;
          font-family: inherit;
        }

        .google-btn:hover {
          background: #f8fafc;
          transform: translateY(-2px);
        }

        .divider { display: flex; align-items: center; text-align: center; margin: 20px 0; color: #94a3b8; }
        .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .divider span { padding: 0 10px; font-size: 0.8rem; }

        .old-price {
          text-decoration: line-through;
          opacity: 0.6;
          margin-right: 6px;
        }

        .new-price {
          color: #2ecc71;
          font-weight: bold;
          font-size: 1.1em;
        }

        .sage-quick-brains {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin: 12px 0;
        }

        .brain-item {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 8px 10px;
          font-size: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
        }

        .brain-item span { opacity: 0.85; }
        .brain-item.good { border-color: #10b981; }
        .brain-item.buy { border-color: #22c55e; }
        .brain-item.wait { border-color: #f59e0b; }
        .brain-item.safe { border-color: #3b82f6; }
        .brain-item.risk { border-color: #ef4444; }
        .brain-item.learn { border-color: #8b5cf6; } 

        .intel-section {
          background: rgba(255,255,255,0.03);
          padding: 12px;
          border-radius: 12px;
          margin: 10px 0;
          text-align: right;
        }

        .intel-section h4 {
          margin: 0 0 8px 0;
          font-size: 0.9rem;
          color: var(--primary);
        }

        .intel-section p {
          margin: 4px 0;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .intel-section ul {
          margin: 5px 0;
          padding-right: 20px;
          font-size: 0.85rem;
        }

        .invite-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, rgba(40, 32, 90, 0.85), rgba(28, 22, 60, 0.9));
          border: 1px solid rgba(138, 99, 255, 0.35);
          border-radius: 16px;
          padding: 14px 16px;
          margin-top: 14px;
          cursor: pointer;
          transition: all 0.25s ease;
          justify-content: center;
        }

        .invite-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(138, 99, 255, 0.25), inset 0 0 0 1px rgba(138, 99, 255, 0.15);
        }

        .invite-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .invite-text {
          font-size: 14.5px;
          color: #e1dbff;
          line-height: 1.6;
          text-align: center;
        }

        .layout-wrapper {
          display: flex;
          gap: 20px;
          margin-top: 20px;
        }

        .results-container {
          flex: 3;
        }

        .affiliate-card {
          flex: 1;
          background: rgba(30, 41, 59, 0.7);
          color: white;
          padding: 15px;
          border-radius: 12px;
          position: sticky;
          top: 80px;
          height: fit-content;
          border: 1px solid var(--glass-border);
        }

        .affiliate-card img {
          width: 100%;
          border-radius: 8px;
        }

        .affiliate-btn {
          display: block;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          text-align: center;
          padding: 10px;
          border-radius: 8px;
          text-decoration: none;
          color: white;
          margin-top: 10px;
          font-weight: 600;
          transition: 0.3s;
        }

        .affiliate-btn:hover {
          filter: brightness(1.1);
        }

        /* Animations */
        @keyframes pulse { 
          0% { opacity: 1; transform:translateY(-50%) scale(1); } 
          50% { opacity: 0.5; transform:translateY(-50%) scale(1.1); } 
          100% { opacity: 1; transform:translateY(-50%) scale(1); } 
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        @media (max-width: 768px) {
          .cat-grid { grid-template-columns: repeat(3, 1fr); }
          .layout-wrapper { flex-direction: column; }
          .affiliate-card { display: none; }
        }

        .upgrade-section {
          background: #1b1b2f;
          border: 1px solid #ff4d4d;
          padding: 12px;
          border-radius: 8px;
          margin: 20px auto;
          max-width: 600px;
        }

        .upgrade-section h3 {
          color: #ff4d4d;
          margin-bottom: 8px;
        }

        .upgrade-btn {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: white;
          padding: 12px 24px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          margin-top: 10px;
          transition: 0.3s;
        }

        .upgrade-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
        }

        .ghost-btn {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid var(--primary);
          color: var(--primary);
          padding: 12px 24px;
          border-radius: 14px;
          cursor: pointer;
          font-weight: 600;
          transition: 0.3s;
        }

        .ghost-btn:hover {
          background: var(--primary);
          color: white;
        }

        .status-text {
          color: var(--primary);
          font-weight: bold;
          margin-top: 30px;
          font-size: 1.1rem;
          text-align: center;
        }

        .footer-links {
          margin-top: 30px;
          font-size: 0.85rem;
          text-align: center;
        }

        .footer-links a {
          color: var(--text-muted);
          margin: 0 5px;
          text-decoration: none;
        }

        .footer-links a:hover {
          color: var(--primary);
        }

        h2.greeting {
          color: var(--primary);
          font-size: 1.1rem;
          margin-bottom: 5px;
          font-weight: 600;
        }
      `}</style>

      {/* Auth Overlay */}
      {showAuth && (
        <div className="auth-overlay">
          <div className="auth-card">
            <div className="auth-header">
              <h1>Findly <span>Sage</span></h1>
              <p>{lang === 'ar' ? 'سجل دخولك لتبدأ البحث الذكي' : 'Sign in to start smart shopping'}</p>
            </div>

            <input type="email" placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'} className="s-input" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
            <input type="password" placeholder={lang === 'ar' ? 'كلمة المرور' : 'Password'} className="s-input" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleLogin} className="action-btn buy-now" style={{ flex: 1 }}>
                {lang === 'ar' ? 'تسجيل دخول' : 'Login'}
              </button>
              <button onClick={handleRegister} className="ghost-btn" style={{ flex: 1 }}>
                {lang === 'ar' ? 'إنشاء حساب' : 'Register'}
              </button>
            </div>

            <div className="divider"><span>{lang === 'ar' ? 'أو' : 'or'}</span></div>

            <button onClick={loginWithGoogle} className="google-btn">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
              {lang === 'ar' ? 'متابعة باستخدام جوجل' : 'Continue with Google'}
            </button>

            <div className="footer-links" style={{ marginTop: '30px' }}>
              <a href="#">{lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
              <a href="#">{lang === 'ar' ? 'شروط الاستخدام' : 'Terms'}</a>
              <a href="#">{lang === 'ar' ? 'من نحن' : 'About'}</a>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header>
        <div className="logo-area">
          <div className="logo">
            Findly <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <p className="tagline">Intelligence Before Purchase</p>
        </div>

        <div className="header-tools">
          <button className="tool-btn" onClick={toggleMode}><i className="fa-solid fa-circle-half-stroke"></i></button>
          <div style={{ position: 'relative' }}>
            <button className="tool-btn" onClick={() => setShowLangMenu(!showLangMenu)}><i className="fa-solid fa-language"></i></button>
            {showLangMenu && (
              <div className="lang-menu">
                <div className="lang-item" onClick={() => setLanguage('ar')}>العربية</div>
                <div className="lang-item" onClick={() => setLanguage('en')}>English</div>
                <div className="lang-item" onClick={() => setLanguage('fr')}>Français</div>
                <div className="lang-item" onClick={() => setLanguage('de')}>Deutsch</div>
                <div className="lang-item" onClick={() => setLanguage('es')}>Español</div>
                <div className="lang-item" onClick={() => setLanguage('tr')}>Türkçe</div>
              </div>
            )}
          </div>
          <button className="tool-btn" onClick={() => setShowWatchModal(true)}>
            <i className="fa-solid fa-bell"></i>
            {watchList.length > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '50%', border: '2px solid var(--bg-dark)' }}>{watchList.length}</span>
            )}
          </button>
          <button className="tool-btn" onClick={() => setShowProfileModal(true)}><i className="fa-solid fa-user-gear"></i></button>
          <button className="tool-btn" onClick={logoutUser} title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}>
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="search-area">
        <div className="energy-box">
          <span>{UI.energy}</span>
          <span style={{ background: 'var(--primary)', color: '#fff', padding: '3px 12px', borderRadius: '20px', fontWeight: '900', fontSize: '0.9rem' }}>{attempts}</span>
          <i className="fa-solid fa-bolt" style={{ color: '#FFD700' }}></i>
        </div>

        <h2 className="greeting">{UI.welcome} {displayName}</h2>
        <h1 className="page-title">{UI.title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '30px' }}>{UI.sub}</p>

        <div className="ai-toggle">
          <i className="fa-solid fa-brain"></i>
          <span>{UI.deep}</span>
          <input type="checkbox" checked={aiDeepMode} onChange={(e) => setAiDeepMode(e.target.checked)} />
        </div>

        <div className="search-wrapper">
          <input 
            type="text" 
            className="search-input" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && runSearch()}
            placeholder={lang === 'ar' ? 'ابحث عن منتج...' : 'Search for a product...'}
          />
          <i className={`fa-solid fa-microphone-lines mic-icon ${micActive ? 'mic-active' : ''}`} onClick={startVoice}></i>
          <button className="send-btn" onClick={runSearch}><i className="fa-solid fa-magnifying-glass"></i></button>
        </div>

        <div className="invite-card" onClick={copyInvite}>
          <div className="invite-icon">🚀</div>
          <div className="invite-text">
            {INVITE_TEXT[lang] || INVITE_TEXT.ar}
          </div>
        </div>

        <div className="ai-options">
          <div className="ai-tag" onClick={() => quickFilter('cheap')}><i className="fa-solid fa-sack-dollar"></i> <span>{UI.cheap}</span></div>
          <div className="ai-tag" onClick={() => quickFilter('top')}><i className="fa-solid fa-star"></i> <span>{UI.top}</span></div>
          <div className="ai-tag" onClick={() => quickFilter('new')}><i className="fa-solid fa-fire"></i> <span>{UI.new}</span></div>
        </div>

        <div className="cat-grid">
          <div className="cat-card" onClick={() => quickSearch(lang === 'ar' ? 'ألعاب' : 'Gaming')}><i className="fa-solid fa-gamepad"></i><span>{UI.game}</span></div>
          <div className="cat-card" onClick={() => quickSearch(lang === 'ar' ? 'جمال' : 'Beauty')}><i className="fa-solid fa-sparkles"></i><span>{UI.beauty}</span></div>
          <div className="cat-card" onClick={() => quickSearch(lang === 'ar' ? 'منزل ذكي' : 'Smart Home')}><i className="fa-solid fa-house-laptop"></i><span>{UI.home}</span></div>
          <div className="cat-card" onClick={() => quickSearch(lang === 'ar' ? 'هواتف' : 'Phones')}><i className="fa-solid fa-mobile-screen-button"></i><span>{UI.c1}</span></div>
          <div className="cat-card" onClick={() => quickSearch(lang === 'ar' ? 'لابتوب' : 'Laptop')}><i className="fa-solid fa-laptop"></i><span>{UI.c2}</span></div>
          <div className="cat-card" onClick={() => quickSearch(lang === 'ar' ? 'ساعات' : 'Watches')}><i className="fa-solid fa-stopwatch"></i><span>{UI.c4}</span></div>
        </div>

        {/* Status */}
        {status && (
          status.startsWith('ENERGY_EMPTY:') ? (
            <div className="upgrade-section">
              <h3>{status.split(':')[1]}</h3>
              <p style={{ fontSize: '0.95rem', opacity: 0.9 }}>{status.split(':')[2]}</p>
              <button className="upgrade-btn" onClick={openUpgrade}>{status.split(':')[3]}</button>
            </div>
          ) : (
            <div className="status-text">{status}</div>
          )
        )}

        {/* Layout Wrapper */}
        <div className="layout-wrapper">
          {/* Results */}
          <div className="results-container">
            {results.map((p, i) => renderProductCard(p, i))}
          </div>

          {/* Affiliate Card */}
          {affiliateProduct && (
            <div className="affiliate-card">
              <img src={affiliateProduct.thumbnail || affiliateProduct.image || ''} alt={affiliateProduct.title || ''} />
              <h3 style={{ fontSize: '0.9rem', marginTop: '10px' }}>{affiliateProduct.title}</h3>
              <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>🔥 {lang === 'ar' ? 'عرض مميز مرتبط ببحثك' : 'Featured offer related to your search'}</p>
              <a 
                href={`https://s.click.aliexpress.com/e/_c3Ol2SAb?redirect=${encodeURIComponent(affiliateProduct.intelligence?.finalVerdict?.bestLink || affiliateProduct.link || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="affiliate-btn"
              >
                🛒 {lang === 'ar' ? 'شراء الآن' : 'Buy Now'}
              </a>
            </div>
          )}
        </div>

        <div className="footer-links">
          <a href="#">{lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
          <a href="#">{lang === 'ar' ? 'شروط الاستخدام' : 'Terms'}</a>
          <a href="#">{lang === 'ar' ? 'من نحن' : 'About'}</a>
        </div>
      </main>

      {/* Watch Modal */}
      {showWatchModal && (
        <div className="modal" onClick={() => setShowWatchModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'var(--primary)', marginTop: 0 }}><i className="fa-solid fa-bell"></i> {UI.watchTitle}</h3>
            <div>
              {watchList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>{lang === 'ar' ? 'لا توجد عناصر في قائمة المراقبة' : 'No items in watch list'}</p>
              ) : (
                watchList.map((item, i) => <div key={i} style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{item.name}</div>)
              )}
            </div>
            <button onClick={() => setShowWatchModal(false)} style={{ background: 'none', color: 'var(--text-muted)', border: 'none', marginTop: '20px', cursor: 'pointer', fontSize: '0.9rem' }}>
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal" onClick={() => setShowProfileModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{UI.p_head}</h3>
            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '5px', opacity: 0.7 }}>{UI.lbl_name}</label>
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder={lang === 'ar' ? 'أدخل اسمك هنا...' : 'Enter your name...'} />
            <label style={{ fontSize: '0.85rem', display: 'block', marginTop: '15px', marginBottom: '5px', opacity: 0.7 }}>{UI.lbl_budget}</label>
            <input type="number" value={userBudget} onChange={(e) => setUserBudget(e.target.value)} placeholder={lang === 'ar' ? 'أقصى ميزانية لديك...' : 'Your max budget...'} />
            <button className="action-btn buy-now" onClick={saveSettings} style={{ width: '100%', marginTop: '20px' }}>
              {lang === 'ar' ? 'حفظ التغييرات ✅' : 'Save Changes ✅'}
            </button>
            <button onClick={() => setShowProfileModal(false)} style={{ background: 'none', color: 'var(--text-muted)', border: 'none', marginTop: '15px', cursor: 'pointer', fontSize: '0.9rem' }}>
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysisModal && analysisData && (
        <div className="modal" onClick={() => setShowAnalysisModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>📊 {lang === 'ar' ? 'تحليل السعر' : 'Price Analysis'}</h3>
            <div style={{ textAlign: 'right', marginTop: '15px' }}>
              <p><strong>📊 {T.market}</strong></p>
              <ul>
                <li>{T.avg_price}: ${analysisData.priceIntel.average ?? '—'}</li>
                <li>{T.competitors}: {analysisData.valueIntel.competitors ?? 0}</li>
              </ul>
              <p><strong>💎 {T.value}</strong></p>
              <ul>
                <li>{T.deal_score}: {analysisData.valueIntel.score ?? 0}%</li>
              </ul>
              <p><strong>🔮 {T.forecast}</strong></p>
              <ul>
                <li>{lang === 'ar' ? 'الاتجاه' : 'Trend'}: {analysisData.forecastIntel.trend}</li>
                <li>{T.expected_price}: ${analysisData.forecastIntel.expectedPrice}</li>
                <li>{T.confidence}: {Math.round((analysisData.forecastIntel.confidence || 0) * 100)}%</li>
              </ul>
              <p><strong>⚠️ {T.trust}</strong></p>
              {analysisData.trustIntel.warnings?.length ? (
                <ul>{analysisData.trustIntel.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>
              ) : <p>✅ {T.no_risks}</p>}
            </div>
            <button className="action-btn buy-now" style={{ marginTop: '15px', width: '100%' }} onClick={() => setShowAnalysisModal(false)}>
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Font Awesome */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;600;700&display=swap" rel="stylesheet" />
    </div>
  )
}
