import { AxiosResponse } from 'axios';

export const raiseForBadResponse = (response: AxiosResponse): void => {
    if (response.status > 299 || response.status < 200) {
        throw {message: "error response type", response};
    }
}