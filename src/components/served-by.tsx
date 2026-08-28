type ServedByProps = {
  hostId: string;
  edgeNodeCount: number;
};

const ServedBy = ({ hostId, edgeNodeCount }: ServedByProps) => (
  <div className="runtime-dock__served inline-flex max-w-xs flex-wrap items-center rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-medium text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur-sm sm:text-sm">
    <span>Served by {edgeNodeCount} node(s), current:</span>
    <span className="ml-1 font-semibold text-slate-900">{hostId}</span>
  </div>
);

export default ServedBy;
