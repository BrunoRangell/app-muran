
import { CalendarClock } from "lucide-react";

interface RevisaoHeaderProps {
  title: string;
  description: string;
  lastUpdateTime?: string;
}

export const RevisaoHeader = ({ 
  title, 
  description, 
  lastUpdateTime 
}: RevisaoHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
          {title}
        </h1>
        <p className="text-gray-500 mt-1">
          {description}
        </p>
      </div>
      
      {lastUpdateTime && (
        <div className="mt-2 md:mt-0 text-sm text-gray-500 flex items-center">
          <CalendarClock className="mr-2 h-4 w-4" />
          <span>Última atualização: {lastUpdateTime}</span>
        </div>
      )}
    </div>
  );
};
