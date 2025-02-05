import { Zap } from "lucide-react";

interface WelcomeHeaderProps {
  greeting: string;
  userName: string;
}

export const WelcomeHeader = ({ greeting, userName }: WelcomeHeaderProps) => {
  return (
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold text-muran-complementary">
        {greeting}, {userName ? userName : "Bem-vindo"}!{" "}
        <Zap className="inline-block ml-2 text-muran-primary" />
      </h1>
      <p className="text-lg text-gray-600">É ótimo ter você aqui na Muran!</p>
    </div>
  );
};