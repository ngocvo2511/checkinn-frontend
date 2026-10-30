/** Total physical inventory; date-specific availability must come from the API. */
export function getConfiguredRoomCount(room: {
  totalRooms?: number | null;
  roomAmount?: number;
  availableRooms?: number;
}): number | null {
  const total = room.totalRooms;
  return typeof total === 'number' && Number.isSafeInteger(total) && total > 0 ? total : null;
}
