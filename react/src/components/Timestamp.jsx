import { format } from 'timeago.js';

export function Timestamp({ timestamp}) {
    return <span title={new Date().toLocaleString()}>{format(timestamp.toLocaleString())}</span>
}