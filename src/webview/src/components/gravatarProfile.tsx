import React from "react";
import md5 from 'md5';
import querystring from 'query-string';

const gravatarHash = (email: string) => {
    email = email.trim().toLowerCase();
    return md5(email, {encoding: "binary"});
};

export interface GravatarProps {
    email: string;
    size?: number;
};

const gravatarImage = (email: string, options: any) => `https://www.gravatar.com/avatar/${gravatarHash(email)}?${querystring.stringify(options as any)}`;

const GravatarProfile: React.FC<GravatarProps> = ({email, size}) => {

    const defaults = {
        size: 24,
        default: "robohash"
    };

    const overrides = {size};

    const gravatarOptions = {...defaults, ...overrides};

    return <img className="gravatar" src={gravatarImage(email, gravatarOptions)} alt="gravatar" />;
};

export default GravatarProfile;
