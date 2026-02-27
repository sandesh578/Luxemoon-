export default function RootLoading() {
    return (
        <div className="min-h-screen bg-[#FDFCFB] animate-pulse">
            <div className="h-[85vh] bg-stone-200" />
            <div className="bg-stone-900 py-6">
                <div className="max-w-7xl mx-auto px-4 flex justify-center gap-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-4 bg-stone-700 rounded w-32" />
                    ))}
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 py-24">
                <div className="h-10 bg-stone-200 rounded w-64 mb-4" />
                <div className="h-4 bg-stone-200 rounded w-96 mb-12" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-4">
                            <div className="aspect-[4/5] rounded-2xl bg-stone-200" />
                            <div className="h-5 bg-stone-200 rounded w-3/4" />
                            <div className="h-4 bg-stone-200 rounded w-1/3" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
