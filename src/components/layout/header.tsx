import { Button } from "../ui/button";

export function Header() {
    return (
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="relative">
                    <span className="text-xl">🔔</span>
                    <span className="absolute top-0 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                </Button>
                <div className="h-8 w-px bg-gray-200 mx-2"></div>
                <Button variant="outline" size="sm">
                    Help
                </Button>
            </div>
        </header>
    );
}
