import httpStatus from "http-status";

// Fixed-window limiter kept in memory. Good enough for a single instance; swap for a shared store if the API is scaled out.
export const rateLimit = ({windowMs, max, message = "Too many attempts. Please wait a moment and try again."}) => {
    const hits = new Map();

    const sweep = setInterval(() => {
        const now = Date.now();
        for(const [key, entry] of hits) {
            if(entry.resetAt <= now) hits.delete(key);
        }
    }, windowMs);
    sweep.unref();

    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip;
        let entry = hits.get(key);

        if(!entry || entry.resetAt <= now) {
            entry = {count: 0, resetAt: now + windowMs};
            hits.set(key, entry);
        }
        entry.count += 1;

        if(entry.count > max) {
            res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
            return res.status(httpStatus.TOO_MANY_REQUESTS).json({message});
        }
        next();
    };
};
