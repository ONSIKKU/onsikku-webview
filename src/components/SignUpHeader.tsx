import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Props = {
  title: string;
  description?: string;
  currentStep?: number;
  totalSteps?: number;
  showBackButton?: boolean;
};

export default function SignUpHeader({
  title,
  description,
  currentStep,
  totalSteps,
  showBackButton = false, // Pages seem to have their own BackButton, but I can integrate it here if needed.
}: Props) {
  const navigate = useNavigate();
  const progressPercentage =
    currentStep && totalSteps ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="space-y-6 pt-2">
      {/* Top Bar with Back Button and Progress Indicator (if applicable) */}
      <div className="flex items-center justify-between">
        {showBackButton ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="-ml-2 rounded-full p-2 text-gray-600 hover:bg-gray-100"
          >
            <ChevronLeft size={24} />
          </button>
        ) : (
          <div className="w-10" /> /* Spacer */
        )}
        
        {/* Step Indicator (e.g., 1/4) */}
        {currentStep && totalSteps && (
             <div className="text-sm font-medium text-gray-500">
               {currentStep}/{totalSteps}
             </div>
        )}
      </div>

      {/* Progress Bar */}
      {currentStep && totalSteps && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full bg-onsikku-dark-orange transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Title & Description */}
      <header className="mt-4 space-y-2">
        <h1 className="text-2xl font-bold leading-tight text-gray-900">
          {title}
        </h1>
        {description && (
          <p className="whitespace-pre-wrap text-base text-gray-500">
            {description}
          </p>
        )}
      </header>
    </div>
  );
}
