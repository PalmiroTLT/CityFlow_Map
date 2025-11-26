import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MapPin, ArrowLeft } from "lucide-react";
import type { User, Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Country = Database["public"]["Tables"]["countries"]["Row"];
type City = Database["public"]["Tables"]["cities"]["Row"];

const Auth = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<"individual" | "business">("individual");
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    // Check if this is a password recovery link
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setIsRecoveryMode(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoveryMode(true);
        }
        
        if (session && !isRecoveryMode) {
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session && !isRecoveryMode) {
        navigate("/");
      }
    });

    fetchCountries();

    return () => subscription.unsubscribe();
  }, [navigate, isRecoveryMode]);

  useEffect(() => {
    if (selectedCountry) {
      fetchCities(selectedCountry);
    }
  }, [selectedCountry]);

  const fetchCountries = async () => {
    const { data } = await supabase.from("countries").select("*");
    if (data) setCountries(data);
  };

  const fetchCities = async (countryId: string) => {
    const { data } = await supabase
      .from("cities")
      .select("*")
      .eq("country_id", countryId);
    if (data) setCities(data);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !selectedCountry || !selectedCity) {
      toast.error(t("fillAllFields"));
      return;
    }

    if (password.length < 6) {
      toast.error(
        language === 'ru' ? 'Пароль должен содержать минимум 6 символов' :
        language === 'sr' ? 'Лозинка мора имати минимум 6 карактера' :
        'Password must be at least 6 characters'
      );
      return;
    }

    setLoading(true);

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      setLoading(false);
      toast.error(
        language === 'ru' ? 'Этот email уже зарегистрирован' :
        language === 'sr' ? 'Овај имејл је већ регистрован' :
        'This email is already registered'
      );
      return;
    }

    const redirectUrl = `${window.location.origin}/auth`;

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          user_type: userType,
          country_id: selectedCountry,
          city_id: selectedCity,
          language: language,
        },
      },
    });

    if (!error && data.user) {
      setTimeout(async () => {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            user_type: userType,
            country_id: selectedCountry,
            city_id: selectedCity,
            language: language,
          })
          .eq("id", data.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }
      }, 1000);
    }

    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error(
          language === 'ru' ? 'Этот email уже зарегистрирован' :
          language === 'sr' ? 'Овај имејл је већ регистрован' :
          'This email is already registered'
        );
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success(
        language === 'ru' ? 'Проверьте email для подтверждения регистрации' : 
        language === 'sr' ? 'Проверите имејл за потврду регистрације' : 
        'Check your email to confirm registration'
      );
      setEmail("");
      setPassword("");
      setFullName("");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(
        language === 'ru' ? 'Пожалуйста, заполните все поля' :
        language === 'sr' ? 'Молимо попуните сва поља' :
        'Please fill in all fields'
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error(
          language === 'ru' ? 'Неверный email или пароль' :
          language === 'sr' ? 'Погрешан имејл или лозинка' :
          'Invalid email or password'
        );
      } else if (error.message.includes('Email not confirmed')) {
        toast.error(
          language === 'ru' ? 'Пожалуйста, подтвердите email перед входом' :
          language === 'sr' ? 'Молимо потврдите имејл пре пријављивања' :
          'Please confirm your email before signing in'
        );
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success(
        language === 'ru' ? 'Вход выполнен успешно!' :
        language === 'sr' ? 'Пријављивање успешно!' :
        'Sign in successful!'
      );
      navigate("/");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error(
        language === 'ru' ? 'Введите email' :
        language === 'sr' ? 'Унесите имејл' :
        'Enter email'
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        language === 'ru' ? 'Инструкции по восстановлению пароля отправлены на email' :
        language === 'sr' ? 'Упутства за опоравак лозинке послата на имејл' :
        'Password recovery instructions sent to email'
      );
      setShowResetPassword(false);
      setResetEmail("");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error(
        language === 'ru' ? 'Заполните все поля' :
        language === 'sr' ? 'Попуните сва поља' :
        'Fill in all fields'
      );
      return;
    }

    if (newPassword.length < 6) {
      toast.error(
        language === 'ru' ? 'Пароль должен содержать минимум 6 символов' :
        language === 'sr' ? 'Лозинка мора имати минимум 6 карактера' :
        'Password must be at least 6 characters'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(
        language === 'ru' ? 'Пароли не совпадают' :
        language === 'sr' ? 'Лозинке се не подударају' :
        'Passwords do not match'
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        language === 'ru' ? 'Пароль успешно изменен! Теперь вы можете войти.' :
        language === 'sr' ? 'Лозинка успешно промењена! Сада можете да се пријавите.' :
        'Password successfully changed! You can now sign in.'
      );
      setIsRecoveryMode(false);
      setNewPassword("");
      setConfirmPassword("");
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Назад на карту</span>
            </Button>
          </div>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t("map")}</CardTitle>
          <CardDescription>
            Интерактивная карта достопримечательностей
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRecoveryMode ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">
                  {language === 'ru' ? 'Установите новый пароль' :
                   language === 'sr' ? 'Поставите нову лозинку' :
                   'Set new password'}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {language === 'ru' ? 'Введите новый пароль для вашего аккаунта' :
                   language === 'sr' ? 'Унесите нову лозинку за ваш налог' :
                   'Enter a new password for your account'}
                </p>
              </div>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">
                    {language === 'ru' ? 'Новый пароль' :
                     language === 'sr' ? 'Нова лозинка' :
                     'New password'}
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    {language === 'ru' ? 'Подтвердите пароль' :
                     language === 'sr' ? 'Потврдите лозинку' :
                     'Confirm password'}
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 
                    (language === 'ru' ? 'Изменение...' :
                     language === 'sr' ? 'Мења се...' :
                     'Updating...') :
                    (language === 'ru' ? 'Изменить пароль' :
                     language === 'sr' ? 'Промените лозинку' :
                     'Update password')
                  }
                </Button>
              </form>
            </div>
          ) : showResetPassword ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetPassword(false)}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Назад ко входу' :
                 language === 'sr' ? 'Назад на пријаву' :
                 'Back to sign in'}
              </Button>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="email@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru' ? 'Мы отправим инструкции по восстановлению пароля на ваш email' :
                     language === 'sr' ? 'Послаћемо упутства за опоравак лозинке на ваш имејл' :
                     'We will send password recovery instructions to your email'}
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 
                    (language === 'ru' ? 'Отправка...' :
                     language === 'sr' ? 'Слање...' :
                     'Sending...') :
                    (language === 'ru' ? 'Восстановить пароль' :
                     language === 'sr' ? 'Опорави лозинку' :
                     'Recover password')
                  }
                </Button>
              </form>
            </div>
          ) : (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t("signIn")}</TabsTrigger>
                <TabsTrigger value="signup">{t("signUp")}</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{t("email")}</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{t("password")}</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    {language === 'ru' ? 'Забыли пароль?' :
                     language === 'sr' ? 'Заборавили сте лозинку?' :
                     'Forgot password?'}
                  </button>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t("loading") : t("signIn")}
                  </Button>
                </form>
              </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t("fullName")}</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Иван Иванов"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t("email")}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t("password")}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-type">{t("userType")}</Label>
                  <Select value={userType} onValueChange={(val: "individual" | "business") => setUserType(val)}>
                    <SelectTrigger id="user-type">
                      <SelectValue placeholder={t("selectUserType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">{t("individual")}</SelectItem>
                      <SelectItem value="business">{t("business")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{t("country")}</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder={t("selectCountry")} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name_sr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCountry && (
                  <div className="space-y-2">
                    <Label htmlFor="city">{t("city")}</Label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger id="city">
                        <SelectValue placeholder={t("selectCity")} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name_sr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("loading") : t("signUp")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
