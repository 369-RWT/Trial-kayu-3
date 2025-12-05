"use client";

import { useState, useEffect } from "react";
import { getInStockLogs, getProducts, recordProductionRun } from "@/app/actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { CalendarIcon, AlertTriangleIcon, MonitorIcon, CheckCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// THE FIX: This prevents the "No logs" bug
export const dynamic = "force-dynamic";

export default function ProductionPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
    const [outputs, setOutputs] = useState<{ productTypeId: string; quantity: number }[]>([]);

    useEffect(() => {
        async function loadData() {
            const l = await getInStockLogs();
            const p = await getProducts();
            setLogs(l || []);
            setProducts(p || []);
            setLoading(false);
        }
        loadData();
    }, []);

    // CALCULATIONS
    const totalInput = logs
        .filter((l) => selectedLogIds.includes(l.id))
        .reduce((sum, l) => sum + l.volumeFinal, 0);

    const totalOutput = outputs.reduce((sum, out) => {
        const product = products.find((p) => p.id === out.productTypeId);
        return sum + (out.quantity * (product?.standardVolume || 0));
    }, 0);

    const waste = totalInput - totalOutput;
    const isPhysicsViolation = waste < 0;
    const canFinalize = !isPhysicsViolation && selectedLogIds.length > 0 && outputs.length > 0;

    // HANDLERS
    const handleToggleLog = (id: string) => {
        setSelectedLogIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleAddOutput = () => {
        if (products.length === 0) return;
        setOutputs([...outputs, { productTypeId: products[0].id, quantity: 1 }]);
    };

    const handleRemoveOutput = (index: number) => {
        setOutputs(outputs.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (isPhysicsViolation) return alert("Physics Violation: Cannot produce more than input!");

        await recordProductionRun({
            batchDate: new Date(),
            logIds: selectedLogIds,
            outputs: outputs
        });

        alert("Production Recorded!");
        router.push('/gudang'); // Redirect to Warehouse to see results
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="text-slate-500 animate-pulse">Loading Factory Environment...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">

            {/* TOP SECTION: KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CARD 1: ACTIVE BATCH */}
                <Card className="border-slate-200 shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                            Active Batch
                        </CardTitle>
                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Shift 1 • Morning
                        </p>
                    </CardContent>
                </Card>

                {/* CARD 2: LIVE WASTE MONITOR */}
                <Card className={cn(
                    "border-0 shadow-md transition-colors duration-300",
                    isPhysicsViolation ? "bg-red-600 text-white" : "bg-slate-900 text-white"
                )}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200 uppercase tracking-wide flex items-center gap-2">
                            <MonitorIcon className="h-4 w-4" /> Live Waste Monitor
                        </CardTitle>
                        {isPhysicsViolation && <AlertTriangleIcon className="h-4 w-4 text-white animate-pulse" />}
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">
                            {isPhysicsViolation ? `ERROR: ${waste} Pts` : `${waste} Pts`}
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                            {isPhysicsViolation
                                ? "PHYSICS VIOLATION: Output exceeds Input"
                                : "Remaining material (Sawdust/Offcuts)"}
                        </p>
                    </CardContent>
                </Card>

                {/* CARD 3: PRODUCTION STATUS & ACTION */}
                <Card className="border-slate-200 shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                            Production Status
                        </CardTitle>
                        {canFinalize ? (
                            <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <div className="h-2 w-2 rounded-full bg-slate-300" />
                        )}
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className={cn(
                                "text-sm font-bold px-2 py-0.5 rounded",
                                isPhysicsViolation ? "bg-red-100 text-red-700" :
                                    canFinalize ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                            )}>
                                {isPhysicsViolation ? "CRITICAL ERROR" : canFinalize ? "READY TO FINALIZE" : "WAITING FOR INPUT"}
                            </span>
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={!canFinalize}
                            size="sm"
                            className={cn(
                                "w-full font-bold transition-all",
                                canFinalize ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                            )}
                        >
                            Confirm Production Run
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* MAIN SECTION: SPLIT SCREEN */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">

                {/* LEFT: SOURCE (LOG INVENTORY) */}
                <Card className="flex flex-col border-slate-200 shadow-sm overflow-hidden h-full">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900">Raw Material Source</CardTitle>
                                <p className="text-sm text-slate-500">Select logs from inventory</p>
                            </div>
                            <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                                {selectedLogIds.length} Selected
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-0 bg-white">
                        {logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-10">
                                <span className="text-4xl mb-2">🪵</span>
                                <p>No available logs in inventory.</p>
                                <Button variant="link" onClick={() => router.push('/pembelian')}>Go to Purchasing</Button>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {logs.map((log) => {
                                    const isSelected = selectedLogIds.includes(log.id);
                                    return (
                                        <div
                                            key={log.id}
                                            onClick={() => handleToggleLog(log.id)}
                                            className={cn(
                                                "p-4 cursor-pointer transition-all hover:bg-slate-50 flex justify-between items-center group",
                                                isSelected ? "bg-slate-50 border-l-4 border-slate-900 pl-3" : "pl-4"
                                            )}
                                        >
                                            <div className="flex flex-col">
                                                <span className={cn("font-mono text-xs mb-1", isSelected ? "text-slate-600" : "text-slate-400")}>
                                                    {log.tagId}
                                                </span>
                                                <span className={cn("font-medium", isSelected ? "text-slate-900" : "text-slate-700")}>
                                                    {log.woodType?.name || 'Unknown Wood'}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {log.supplier?.name} • {new Date(log.purchaseDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-slate-900">{log.volumeFinal}</div>
                                                <div className="text-xs text-slate-400">points</div>
                                                {isSelected && <Badge className="mt-1 bg-slate-900 h-5 text-[10px]">SELECTED</Badge>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>

                    <div className="p-4 bg-slate-50 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Total Input Amount</span>
                            <span className="text-xl font-bold text-slate-900">{totalInput.toLocaleString()} <span className="text-sm font-normal text-slate-500">Pts</span></span>
                        </div>
                    </div>
                </Card>

                {/* RIGHT: FACTORY OUTPUT */}
                <Card className="flex flex-col border-slate-200 shadow-sm overflow-hidden h-full">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900">Factory Output</CardTitle>
                                <p className="text-sm text-slate-500">Define produced items</p>
                            </div>
                            <Button onClick={handleAddOutput} size="sm" className="bg-slate-900 hover:bg-slate-800 text-white">
                                + Add Item
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4 bg-slate-50/30 space-y-3">
                        {outputs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                                <span className="text-4xl mb-2">🏭</span>
                                <p>No products added yet.</p>
                                <p className="text-xs">Click "+ Add Item" to start.</p>
                            </div>
                        ) : (
                            outputs.map((out, idx) => (
                                <div key={idx} className="flex gap-3 items-start p-4 border border-slate-200 rounded-lg bg-white shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex-1">
                                        <label className="text-xs text-slate-500 font-medium ml-1">Product Type</label>
                                        <select
                                            className="w-full mt-1 p-2 border border-slate-200 rounded-md font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                            value={out.productTypeId}
                                            onChange={(e) => {
                                                const newOut = [...outputs];
                                                newOut[idx].productTypeId = e.target.value;
                                                setOutputs(newOut);
                                            }}
                                        >
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.standardVolume} pts)</option>)}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <label className="text-xs text-slate-500 font-medium ml-1">Qty</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full mt-1 p-2 border border-slate-200 rounded-md text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                            value={out.quantity}
                                            onChange={(e) => {
                                                const newOut = [...outputs];
                                                newOut[idx].quantity = Number(e.target.value);
                                                setOutputs(newOut);
                                            }}
                                        />
                                    </div>
                                    <div className="pt-6">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-400 hover:text-red-500 h-10 w-10"
                                            onClick={() => handleRemoveOutput(idx)}
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>

                    <div className="p-4 bg-slate-50 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Total Output Amount</span>
                            <span className="text-xl font-bold text-emerald-600">{totalOutput.toLocaleString()} <span className="text-sm font-normal text-slate-500">Pts</span></span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}