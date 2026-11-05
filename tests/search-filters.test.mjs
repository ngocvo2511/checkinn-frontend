import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSearchFilters, patchSearchFilters } from '../lib/search/criteria.ts';

test('shared budget defaults do not silently limit initial results to five million', () => {
  assert.deepEqual(parseSearchFilters(new URLSearchParams()).priceRange,[0,24000000]);
});
test('zero budget is explicit, malformed and crossed ranges normalize consistently', () => {
  assert.deepEqual(parseSearchFilters(new URLSearchParams('maxPrice=0')).priceRange,[0,0]);
  assert.deepEqual(parseSearchFilters(new URLSearchParams('minPrice=300&maxPrice=200')).priceRange,[200,200]);
  assert.deepEqual(parseSearchFilters(new URLSearchParams('minPrice=NaN&maxPrice=Infinity')).priceRange,[0,24000000]);
});
test('changing an amenity preserves budget, destination, dates and unrelated filters', () => {
  const before=new URLSearchParams('cityId=fixture&checkIn=2026-12-01&maxPrice=800000&star=5');
  const after=patchSearchFilters(before,{amenities:['WiFi','Pool']});
  assert.equal(after.get('maxPrice'),'800000'); assert.equal(after.get('cityId'),'fixture');
  assert.equal(after.get('checkIn'),'2026-12-01'); assert.equal(after.get('star'),'5');
  assert.equal(before.has('amenity'),false);
  assert.deepEqual(parseSearchFilters(after).amenities,['Pool','WiFi']);
});
test('all published filters round-trip through URL and clearing affects only its own field', () => {
  const input={accommodationTypes:[],priceRange:[200000,800000],amenities:['A&B','Wi Fi'],starRatings:[3,5],guestRatings:[8,9]};
  const params=patchSearchFilters(new URLSearchParams('rooms=2'),input);
  assert.deepEqual(parseSearchFilters(new URLSearchParams(params.toString())),input);
  const cleared=patchSearchFilters(params,{amenities:[]});
  assert.deepEqual(parseSearchFilters(cleared),{...input,amenities:[]});
  assert.equal(cleared.get('rooms'),'2');
});
import { amenityTitles, guestReviewFacts, matchesHotelAmenities } from '../lib/search/hotel-facts.ts';

test('hotel facts preserve the full deterministic amenity set and unknown review state', () => {
  const categories = [{items:['A','B','C','D','E','A'].map(title => ({title}))}];
  assert.deepEqual(amenityTitles(categories), ['A','B','C','D','E']);
  assert.deepEqual(amenityTitles(categories), amenityTitles(categories));
  assert.deepEqual(amenityTitles([]), []);
  assert.equal(matchesHotelAmenities(amenityTitles(categories), ['A','E']), true);
  assert.equal(matchesHotelAmenities(['Wi-Fi'], ['WiFi']), false);
  assert.equal(matchesHotelAmenities(['A'], ['A','Room-only amenity']), false);
  assert.equal(matchesHotelAmenities([], ['Unknown']), false);
  assert.deepEqual(guestReviewFacts(null), {rating:null,reviewCount:null});
  assert.deepEqual(guestReviewFacts({totalReviews:0,averageRating:8}), {rating:null,reviewCount:0});
  assert.deepEqual(guestReviewFacts({totalReviews:2,averageRating:4.5}), {rating:4.5,reviewCount:2});
  assert.deepEqual(guestReviewFacts({totalReviews:2,averageRating:NaN}), {rating:null,reviewCount:2});
});
