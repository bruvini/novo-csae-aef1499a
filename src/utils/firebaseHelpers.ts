
import { FieldValue, Timestamp } from 'firebase/firestore';

/**
 * Helper function to cast Firestore FieldValue to Timestamp for type compatibility
 * This doesn't actually convert FieldValue to Timestamp, but helps with TypeScript type checking
 */
export function castFieldValueToTimestamp(fieldValue: FieldValue): Timestamp {
  // This is just a type assertion to make TypeScript happy
  // In reality, serverTimestamp() will be properly handled by Firestore
  return fieldValue as unknown as Timestamp;
}
