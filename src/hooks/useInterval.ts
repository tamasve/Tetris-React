import { useEffect, useRef } from "react";


export function useInterval(callback: () => void, interval: number | null): void {

    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (interval == null) return;
        
        const intervalID = setInterval(() => callbackRef.current(), interval);

        return () => clearInterval(intervalID);
        
    }, [interval]);
}