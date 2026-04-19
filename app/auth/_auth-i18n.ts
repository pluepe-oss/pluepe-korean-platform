export type Lang = "ko" | "en" | "id" | "zh" | "ja";

export const LANG_LABEL: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  id: "Bahasa Indonesia",
  zh: "中文",
  ja: "日本語",
};

type Strings = {
  brand: string;
  subtitle: string;
  signInTitle: string;
  signUpTitle: string;
  email: string;
  password: string;
  passwordConfirm: string;
  submitSignIn: string;
  submitSignUp: string;
  google: string;
  kakao: string;
  or: string;
  noAccount: string;
  haveAccount: string;
  signUp: string;
  signIn: string;
  error: string;
  errorMismatch: string;
  checkEmail: string;
};

export const AUTH_DICT: Record<Lang, Strings> = {
  ko: {
    brand: "pluepe",
    subtitle: "한국어 학습의 시작",
    signInTitle: "로그인",
    signUpTitle: "회원가입",
    email: "이메일",
    password: "비밀번호",
    passwordConfirm: "비밀번호 확인",
    submitSignIn: "이메일로 로그인",
    submitSignUp: "이메일로 회원가입",
    google: "Google로 계속하기",
    kakao: "카카오로 계속하기",
    or: "또는",
    noAccount: "계정이 없으신가요?",
    haveAccount: "이미 계정이 있으신가요?",
    signUp: "회원가입",
    signIn: "로그인",
    error: "요청에 실패했습니다",
    errorMismatch: "비밀번호가 일치하지 않습니다",
    checkEmail: "이메일을 확인해 주세요",
  },
  en: {
    brand: "pluepe",
    subtitle: "Start learning Korean",
    signInTitle: "Sign in",
    signUpTitle: "Sign up",
    email: "Email",
    password: "Password",
    passwordConfirm: "Confirm password",
    submitSignIn: "Sign in with email",
    submitSignUp: "Sign up with email",
    google: "Continue with Google",
    kakao: "Continue with Kakao",
    or: "or",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    signUp: "Sign up",
    signIn: "Sign in",
    error: "Request failed",
    errorMismatch: "Passwords do not match",
    checkEmail: "Please check your email",
  },
  id: {
    brand: "pluepe",
    subtitle: "Mulai belajar bahasa Korea",
    signInTitle: "Masuk",
    signUpTitle: "Daftar",
    email: "Email",
    password: "Kata sandi",
    passwordConfirm: "Konfirmasi kata sandi",
    submitSignIn: "Masuk dengan email",
    submitSignUp: "Daftar dengan email",
    google: "Lanjutkan dengan Google",
    kakao: "Lanjutkan dengan Kakao",
    or: "atau",
    noAccount: "Belum punya akun?",
    haveAccount: "Sudah punya akun?",
    signUp: "Daftar",
    signIn: "Masuk",
    error: "Terjadi kesalahan",
    errorMismatch: "Kata sandi tidak cocok",
    checkEmail: "Silakan periksa email Anda",
  },
  zh: {
    brand: "pluepe",
    subtitle: "开始学习韩语",
    signInTitle: "登录",
    signUpTitle: "注册",
    email: "邮箱",
    password: "密码",
    passwordConfirm: "确认密码",
    submitSignIn: "使用邮箱登录",
    submitSignUp: "使用邮箱注册",
    google: "使用 Google 继续",
    kakao: "使用 Kakao 继续",
    or: "或",
    noAccount: "还没有账号？",
    haveAccount: "已有账号？",
    signUp: "注册",
    signIn: "登录",
    error: "操作失败",
    errorMismatch: "两次密码不一致",
    checkEmail: "请查看邮箱进行确认",
  },
  ja: {
    brand: "pluepe",
    subtitle: "韓国語学習を始めよう",
    signInTitle: "ログイン",
    signUpTitle: "新規登録",
    email: "メール",
    password: "パスワード",
    passwordConfirm: "パスワード確認",
    submitSignIn: "メールでログイン",
    submitSignUp: "メールで登録",
    google: "Google で続行",
    kakao: "Kakao で続行",
    or: "または",
    noAccount: "アカウントをお持ちでない方",
    haveAccount: "すでにアカウントをお持ちの方",
    signUp: "新規登録",
    signIn: "ログイン",
    error: "処理に失敗しました",
    errorMismatch: "パスワードが一致しません",
    checkEmail: "メールをご確認ください",
  },
};
