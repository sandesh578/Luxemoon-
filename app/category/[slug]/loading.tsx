export default function CategoryLoading() {
    return (
        <div className="min-h-screen bg-[#FDFCFB] animate-pulse">
            <div className="h-[40vh] bg-stone-300" />
            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="h-4 bg-stone-200 rounded w-48 mb-12" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
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
