import { expect, test } from 'bun:test';
import { dimensionCategories } from '../src/lib/artwork-facets';
import { parseArtworkInput, isCurrentArtworkEditor } from '../src/lib/admin-input';
test('measurement categories use numeric values and unit conversion', () => {
 expect(dimensionCategories({width:12,height:16,depth:null,dimensionUnit:'in'})).toEqual({size:'Small',orientation:'Portrait'});
 expect(dimensionCategories({width:101,height:60,depth:null,dimensionUnit:'cm'})).toEqual({size:'Large',orientation:'Landscape'});
 expect(dimensionCategories({width:60,height:60,depth:null,dimensionUnit:'cm'})).toEqual({size:'Medium',orientation:'Square'});
 for (const height of [0,null]) expect(dimensionCategories({width:12,height,depth:null,dimensionUnit:'in'})).toBeNull();
});
test('measurements reject invalid numbers and stale generic forms', () => {
 const input={title:'Study',slug:'study',images:[],dimensionUnit:'in'};
 for (const width of [-1,'NaN',true,{},'  ']) expect(()=>parseArtworkInput({...input,width})).toThrow();
 expect(()=>parseArtworkInput({...input,dimensionUnit:'ft'})).toThrow();
 expect(parseArtworkInput({...input,width:'12',height:'16'}).depth).toBeNull();
 expect(isCurrentArtworkEditor({...input,tags:[],facetIds:[],newFacets:[]})).toBe(false);
});
