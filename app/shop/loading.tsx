export default function ShopLoading() {
    return (
        <div className="min-h-screen bg-[#FDFCFB] animate-pulse">
            <div className="bg-stone-900 py-16 px-4">
                <div className="max-w-7xl mx-auto flex flex-col items-center space-y-4">
                    <div className="h-10 bg-stone-700 rounded-xl w-72" />
                    <div className="h-4 bg-stone-700 rounded w-96" />
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="space-y-4">
                            <div className="aspect-[3/4] rounded-3xl bg-stone-200" />
                            <div className="h-5 bg-stone-200 rounded w-3/4" />
                            <div className="h-4 bg-stone-200 rounded w-1/3" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
