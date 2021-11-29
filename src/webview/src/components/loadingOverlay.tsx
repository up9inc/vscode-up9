import React, {useEffect, useState} from "react";

const SpinnerShowDelayMs = 350;

interface LoadingOverlayProps {
    delay?: number
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({delay}) => {

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let isRelevant = true;

        setTimeout(() => {
            if (isRelevant)
                setIsVisible(true);
        }, delay ?? SpinnerShowDelayMs);

        return () => {isRelevant = false};
    }, []);

    return <div className="loading-overlay-container" hidden={!isVisible}>
        <div className="loading-overlay-spinner"/>
    </div>
};