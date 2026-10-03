import { expect, test } from 'bun:test';
import { dimensionOrientation } from '../src/lib/artwork-facets';
import { parseArtworkInput, isCurrentArtworkEditor } from '../src/lib/admin-input';
test('orientation uses numeric width and height', () => {
 expect(dimensionOrientation({width:12,height:16})).toBe('Portrait');
 expect(dimensionOrientation({width:101,height:60})).toBe('Landscape');
 expect(dimensionOrientation({width:60,height:60})).toBe('Square');
 for (const height of [0,null]) expect(dimensionOrientation({width:12,height})).toBeNull();
});
test('measurements reject invalid numbers and stale generic forms', () => {
 const input={title:'Study',slug:'study',images:[],dimensionUnit:'in'};
 for (const width of [-1,'NaN',true,{},'  ']) expect(()=>parseArtworkInput({...input,width})).toThrow();
 expect(()=>parseArtworkInput({...input,dimensionUnit:'ft'})).toThrow();
 expect(parseArtworkInput({...input,width:'12',height:'16'}).depth).toBeNull();
 expect(isCurrentArtworkEditor({...input,tags:[],facetIds:[],newFacets:[]})).toBe(false);
});

test('manual categories retain existing spelling and custom names', () => {
 const input = parseArtworkInput({title:'Test',slug:'test',images:[],size:'Miniature',orientation:'portrait'});
 expect(input).not.toHaveProperty('size');
 expect(input.orientation).toBe('portrait');
});
