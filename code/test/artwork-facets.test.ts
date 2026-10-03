import { expect, test } from 'bun:test';
import { normalizeArtworkFacets } from '../src/lib/artwork-facets';
const facets = (values: Record<string,string>) => Object.entries(values).map(([key,value])=>({namespace:'artwork',key,value}));
test('measurements normalize numbers and replace derived categories in either unit', () => {
 expect(normalizeArtworkFacets(facets({width:'012',height:'16','dimension-unit':'in',size:'Large',orientation:'Landscape'}))).toEqual(facets({width:'12',height:'16','dimension-unit':'in',size:'Small',orientation:'Portrait'}));
 expect(normalizeArtworkFacets(facets({width:'101',height:'60','dimension-unit':'cm'}))).toContainEqual({namespace:'artwork',key:'size',value:'Large'});
 expect(normalizeArtworkFacets(facets({width:'60',height:'60','dimension-unit':'cm'}))).toContainEqual({namespace:'artwork',key:'orientation',value:'Square'});
});
test('invalid, conflicting, and unitless measurements fail without inventing depth', () => {
 for (const value of ['-1','NaN','Infinity','12 inches','']) expect(()=>normalizeArtworkFacets(facets({width:value,'dimension-unit':'in'}))).toThrow();
 expect(()=>normalizeArtworkFacets(facets({width:'12'}))).toThrow('dimension-unit');
 expect(()=>normalizeArtworkFacets(facets({width:'12','dimension-unit':'ft'}))).toThrow();
 expect(()=>normalizeArtworkFacets([...facets({width:'12','dimension-unit':'in'}),...facets({width:'14'})])).toThrow('only one width');
 expect(normalizeArtworkFacets(facets({width:'12',height:'14','dimension-unit':'in'})).some(f=>f.key==='depth')).toBe(false);
 expect(normalizeArtworkFacets([{namespace:'shipping',key:'width',value:'Custom'}])).toEqual([{namespace:'shipping',key:'width',value:'Custom'}]);
});
