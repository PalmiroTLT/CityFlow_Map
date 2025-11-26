import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface EmailTemplate {
  id: string;
  template_type: string;
  subject_sr: string;
  subject_ru: string;
  subject_en: string;
  body_sr: string;
  body_ru: string;
  body_en: string;
}

const templateTypes = [
  { value: "email_verification", labelSr: "Верификација имејла", labelRu: "Верификация email", labelEn: "Email Verification" },
  { value: "password_recovery", labelSr: "Рековери лозинке", labelRu: "Восстановление пароля", labelEn: "Password Recovery" },
  { value: "email_change", labelSr: "Промена имејла", labelRu: "Смена email", labelEn: "Email Change" },
  { value: "magic_link", labelSr: "Magic Link", labelRu: "Magic Link", labelEn: "Magic Link" },
];

export default function EmailTemplatesTab() {
  const { language } = useLanguage();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedType, setSelectedType] = useState(templateTypes[0].value);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentTemplate = templates.find(t => t.template_type === selectedType);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast.error(
        language === 'ru' ? 'Ошибка загрузки шаблонов' :
        language === 'sr' ? 'Грешка при учитавању шаблона' :
        'Error loading templates'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentTemplate) return;

    setSaving(true);
    try {
      const formData = new FormData(document.getElementById('email-template-form') as HTMLFormElement);
      
      const { error } = await supabase
        .from("email_templates")
        .update({
          subject_sr: formData.get('subject_sr') as string,
          subject_ru: formData.get('subject_ru') as string,
          subject_en: formData.get('subject_en') as string,
          body_sr: formData.get('body_sr') as string,
          body_ru: formData.get('body_ru') as string,
          body_en: formData.get('body_en') as string,
        })
        .eq('id', currentTemplate.id);

      if (error) throw error;

      toast.success(
        language === 'ru' ? 'Шаблон сохранен' :
        language === 'sr' ? 'Шаблон сачуван' :
        'Template saved'
      );
      
      fetchTemplates();
    } catch (error: any) {
      toast.error(
        language === 'ru' ? 'Ошибка сохранения шаблона' :
        language === 'sr' ? 'Грешка при чувању шаблона' :
        'Error saving template'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">
      {language === 'ru' ? 'Загрузка...' : language === 'sr' ? 'Учитавање...' : 'Loading...'}
    </div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'ru' ? 'Email Шаблоны' : language === 'sr' ? 'Email Шаблони' : 'Email Templates'}
          </CardTitle>
          <CardDescription>
            {language === 'ru' ? 'Управление шаблонами email сообщений. Используйте {{ .ConfirmationURL }} для ссылки подтверждения.' :
             language === 'sr' ? 'Управљање шаблонима имејл порука. Користите {{ .ConfirmationURL }} за линк потврде.' :
             'Manage email templates. Use {{ .ConfirmationURL }} for confirmation link.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              {templateTypes.map(type => (
                <TabsTrigger key={type.value} value={type.value}>
                  {language === 'ru' ? type.labelRu : language === 'sr' ? type.labelSr : type.labelEn}
                </TabsTrigger>
              ))}
            </TabsList>

            {templateTypes.map(type => (
              <TabsContent key={type.value} value={type.value}>
                {currentTemplate && (
                  <form id="email-template-form" className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject_sr">
                          {language === 'ru' ? 'Тема (Сербский)' : language === 'sr' ? 'Тема (Српски)' : 'Subject (Serbian)'}
                        </Label>
                        <Input
                          id="subject_sr"
                          name="subject_sr"
                          defaultValue={currentTemplate.subject_sr}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="body_sr">
                          {language === 'ru' ? 'Текст (Сербский)' : language === 'sr' ? 'Текст (Српски)' : 'Body (Serbian)'}
                        </Label>
                        <Textarea
                          id="body_sr"
                          name="body_sr"
                          defaultValue={currentTemplate.body_sr}
                          rows={6}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject_ru">
                          {language === 'ru' ? 'Тема (Русский)' : language === 'sr' ? 'Тема (Руски)' : 'Subject (Russian)'}
                        </Label>
                        <Input
                          id="subject_ru"
                          name="subject_ru"
                          defaultValue={currentTemplate.subject_ru}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="body_ru">
                          {language === 'ru' ? 'Текст (Русский)' : language === 'sr' ? 'Текст (Руски)' : 'Body (Russian)'}
                        </Label>
                        <Textarea
                          id="body_ru"
                          name="body_ru"
                          defaultValue={currentTemplate.body_ru}
                          rows={6}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject_en">
                          {language === 'ru' ? 'Тема (Английский)' : language === 'sr' ? 'Тема (Енглески)' : 'Subject (English)'}
                        </Label>
                        <Input
                          id="subject_en"
                          name="subject_en"
                          defaultValue={currentTemplate.subject_en}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="body_en">
                          {language === 'ru' ? 'Текст (Английский)' : language === 'sr' ? 'Текст (Енглески)' : 'Body (English)'}
                        </Label>
                        <Textarea
                          id="body_en"
                          name="body_en"
                          defaultValue={currentTemplate.body_en}
                          rows={6}
                        />
                      </div>
                    </div>

                    <Button type="button" onClick={handleSave} disabled={saving}>
                      {saving ? (
                        language === 'ru' ? 'Сохранение...' : language === 'sr' ? 'Чување...' : 'Saving...'
                      ) : (
                        language === 'ru' ? 'Сохранить' : language === 'sr' ? 'Сачувај' : 'Save'
                      )}
                    </Button>
                  </form>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
