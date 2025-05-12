interface Step {
  id: number
  name: string
  description: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full">
      <ol className="flex items-center w-full">
        {steps.map((step, index) => (
          <li key={step.id} className={`flex items-center ${index < steps.length - 1 ? "w-full" : ""}`}>
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.id
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600"
                }`}
              >
                {currentStep > step.id ? (
                  <svg
                    className="w-3.5 h-3.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 16 12"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 5.917 5.724 10.5 15 1.5"
                    />
                  </svg>
                ) : (
                  <span>{step.id + 1}</span>
                )}
              </div>
              <div className="mt-2">
                <h3 className="text-sm font-medium">{step.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-full h-0.5 mx-2 ${
                  currentStep > step.id ? "bg-emerald-600" : "bg-gray-200 dark:bg-gray-700"
                }`}
              ></div>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
