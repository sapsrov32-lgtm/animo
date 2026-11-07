import { ComingSoon } from '@/components/ui/ComingSoon';

export default function LoginPage() {
  return (
    <ComingSoon
      title="Вход и регистрация"
      subtitle="Авторизация через Supabase Auth (email + пароль) для сохранения личных списков и отметок прогресса."
      stepInfo="Шаг 5"
      icon="lock"
    />
  );
}
