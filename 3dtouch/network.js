export const HYBRID_ICE_CONFIG = {
    config: {
        iceServers: [
            // 1. STUN miễn phí ưu tiên tốc độ (Mạng thoáng / Cùng Wi-Fi)
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
        ],
        iceCandidatePoolSize: 10,
    },
};
export async function inspectNetworkType(peerConnection) {
    try {
        const stats = await peerConnection.getStats();
        let selectedCandidatePair = null;
        stats.forEach((report) => {
            if (report.type === 'transport' && report.selectedCandidatePairId) {
                const candidatePair = stats.get(report.selectedCandidatePairId);
                if (candidatePair?.type === 'candidate-pair') {
                    selectedCandidatePair = candidatePair;
                }
            }
            else if (report.type === 'candidate-pair') {
                const candidatePair = report;
                if (candidatePair.nominated && candidatePair.state === 'succeeded') {
                    selectedCandidatePair = candidatePair;
                }
            }
        });
        if (selectedCandidatePair) {
            const localCandidate = stats.get(selectedCandidatePair.localCandidateId);
            const remoteCandidate = stats.get(selectedCandidatePair.remoteCandidateId);
            const localType = localCandidate?.type === 'local-candidate' ? localCandidate.candidateType : '';
            const remoteType = remoteCandidate?.type === 'remote-candidate' ? remoteCandidate.candidateType : '';
            const roundTripTime = selectedCandidatePair.currentRoundTripTime;
            const latencyMs = Number.isFinite(roundTripTime) ? Math.round(roundTripTime * 1000) : 0;
            if (localType === 'relay' || remoteType === 'relay') {
                return {
                    connectionType: 'WAN_RELAY',
                    latencyMs,
                    candidateType: 'Mạng ngoài · TURN relay',
                };
            }
            if (localType === 'host' && remoteType === 'host') {
                return {
                    connectionType: 'LAN_LOCAL',
                    latencyMs,
                    candidateType: 'P2P trực tiếp · ưu tiên mạng nội bộ',
                };
            }
            return {
                connectionType: 'WAN_P2P',
                latencyMs,
                candidateType: 'Mạng ngoài · P2P qua STUN',
            };
        }
    }
    catch (e) {
        console.warn('Đang kiểm tra kết nối mạng...', e);
    }
    if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
        return {
            connectionType: 'DISCONNECTED',
            latencyMs: 0,
            candidateType: 'Đã ngắt kết nối',
        };
    }
    return {
        connectionType: 'CONNECTING',
        latencyMs: 0,
        candidateType: 'Đang thiết lập mạng...',
    };
}
