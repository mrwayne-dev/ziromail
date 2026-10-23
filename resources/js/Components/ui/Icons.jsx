/*
 * Status and action glyphs shared by the auth, checkout, onboarding, dashboard
 * and webmail screens. Thin wrappers over lucide-react so every page draws from
 * the same icon set and new work can import directly from lucide.
 *
 * All are decorative (aria-hidden); the text beside them carries the meaning.
 */
import { AlertCircle, Check, ChevronDown, CircleAlert, Clock, Copy, HelpCircle, Info, Lock, Mail, Plus, X, Zap } from 'lucide-react';

const defaults = { 'aria-hidden': true, strokeWidth: 1.75 };

export function InfoIcon({ size = 17 })        { return <Info        size={size} {...defaults} />; }
export function AlertIcon({ size = 17 })       { return <CircleAlert size={size} {...defaults} />; }
export function CheckIcon({ size = 13 })       { return <Check       size={size} {...defaults} strokeWidth={2.4} />; }
export function CrossIcon({ size = 13 })       { return <X           size={size} {...defaults} strokeWidth={2.2} />; }
export function ClockIcon({ size = 13 })       { return <Clock       size={size} {...defaults} />; }
export function ChevronDownIcon({ size = 13 }) { return <ChevronDown size={size} {...defaults} />; }
export function HelpIcon({ size = 16 })        { return <HelpCircle  size={size} {...defaults} />; }
export function LockIcon({ size = 16 })        { return <Lock        size={size} {...defaults} fill="currentColor" strokeWidth={1.4} />; }
export function PlusIcon({ size = 15 })        { return <Plus        size={size} {...defaults} />; }
export function MailIcon({ size = 30 })        { return <Mail        size={size} {...defaults} />; }
export function BoltIcon({ size = 20 })        { return <Zap         size={size} {...defaults} />; }
export function CopyIcon({ size = 20 })        { return <Copy        size={size} {...defaults} />; }

/* Alias kept because the audit called it out; AlertIcon above matches the previous visual. */
export { AlertCircle };
