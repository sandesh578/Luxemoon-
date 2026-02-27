export default function ProductLoading() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen animate-pulse">
            <div className="h-4 bg-stone-200 rounded w-32 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="aspect-square rounded-2xl bg-stone-200" />
                <div className="space-y-6">
                    <div className="h-4 bg-stone-200 rounded w-24" />
                    <div className="h-10 bg-stone-200 rounded w-3/4" />
                    <div className="h-8 bg-stone-200 rounded w-40" />
                    <div className="h-20 bg-stone-200 rounded w-full" />
                    <div className="h-14 bg-stone-200 rounded-2xl w-full" />
                </div>
            </div>
        </div>
    );
}
