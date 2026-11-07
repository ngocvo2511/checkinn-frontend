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
  const input={amenityCodes:["WIFI_FREE"],accommodationTypes:[],priceRange:[200000,800000],amenities:['A&B','Wi Fi'],starRatings:[3,5],guestRatings:[8,9]};
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

import {parseStayDate,stayNights} from '../lib/search/stay-dates.ts';
test('civil stay dates do not shift in a western timezone and nights ignore daylight saving hours',()=>{
  const before=process.env.TZ;process.env.TZ='America/Los_Angeles';
  try {
    const date=parseStayDate('2099-01-01');assert.equal(date.getFullYear(),2099);assert.equal(date.getMonth(),0);assert.equal(date.getDate(),1);
    assert.equal(stayNights(parseStayDate('2026-11-01'),parseStayDate('2026-11-02')),1);
    assert.equal(stayNights(parseStayDate('2026-03-08'),parseStayDate('2026-03-09')),1);
  } finally {if(before===undefined)delete process.env.TZ;else process.env.TZ=before;}
});
test('invalid stay dates remain unknown and valid leap days round trip',()=>{
  for(const value of [null,undefined,'','not-a-date','2026-02-29','2026-13-01','2026-1-01','2026-01-01T00:00:00Z'])assert.equal(parseStayDate(value),null);
  assert.equal(parseStayDate('2024-02-29').getDate(),29);assert.equal(stayNights(new Date('invalid'),new Date()),null);
});

 test('canonical codes and legacy literal amenities remain independent across URL changes',()=>{
 const before=new URLSearchParams('cityId=fixture&amenity=Wi-Fi&amenityCodes=WIFI_PAID&amenityCodes=WIFI_FREE&amenityCodes=WIFI_FREE');
 assert.deepEqual(parseSearchFilters(before).amenityCodes,['WIFI_FREE','WIFI_PAID']);
 assert.deepEqual(parseSearchFilters(before).amenities,['Wi-Fi']);
 const after=patchSearchFilters(before,{amenityCodes:[]});
 assert.equal(after.get('amenity'),'Wi-Fi');assert.equal(after.get('cityId'),'fixture');assert.equal(after.has('amenityCodes'),false);
 });
