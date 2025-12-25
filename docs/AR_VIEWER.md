# AR Viewer Feature

## Overview

The AR (Augmented Reality) Viewer allows users to visualize artwork on their walls using their mobile device's camera. This feature enhances the shopping experience by helping users see how artwork would look in their space before making a purchase.

## Features

- **Camera Access**: Uses the device's rear-facing camera for a realistic view
- **Interactive Controls**:
  - Drag to move artwork position on the wall
  - Zoom in/out to adjust size
  - Rotate to change orientation
  - Reset button to return to default position
- **Mobile-First Design**: Optimized for mobile devices with touch controls
- **Feature Detection**: Automatically hides the AR button on unsupported devices

## Technical Implementation

### Components

#### ARViewer Component (`src/components/ARViewer.tsx`)

The main AR viewer component that handles:
- Camera stream access using `navigator.mediaDevices.getUserMedia()`
- Video feed display as background
- Artwork overlay with dynamic positioning
- Touch/pointer event handling for dragging
- Control buttons for zoom, rotate, and reset

**Key Props:**
- `imageUrl`: URL of the artwork image to display
- `artworkTitle`: Title of the artwork for display
- `onClose`: Callback function to close the AR viewer

#### ARViewButton Component (`src/components/ARViewButton.tsx`)

A button component that:
- Checks for camera API support
- Opens the AR viewer when clicked
- Hides itself on unsupported devices

**Key Props:**
- `imageUrl`: URL of the artwork image
- `artworkTitle`: Title of the artwork
- `className`: Optional CSS classes for styling

### Integration Points

The AR viewer is integrated into two main pages:

1. **Artwork Detail Page** (`src/app/artworks/[slug]/page.tsx`)
   - Displays "View on Your Wall" button alongside "View in Store" link
   - Only shown if artwork has a default image

2. **Store Product Page** (`src/app/store/[slug]/page.tsx`)
   - Displays AR button in the purchase section
   - Uses product image or artwork's default image

## Browser Compatibility

The AR viewer requires:
- Modern browser with `getUserMedia` API support
- Camera access permissions
- HTTPS connection (required by browsers for camera access)

### Supported Browsers

- ✅ Chrome/Edge (Android & Desktop)
- ✅ Safari (iOS & macOS)
- ✅ Firefox (Android & Desktop)
- ❌ Older browsers without `getUserMedia` support

## User Flow

1. User browses artwork or product page
2. User clicks "View on Your Wall" button
3. Browser requests camera permission
4. User grants permission
5. AR viewer opens with camera feed
6. User sees artwork overlaid on camera view
7. User can:
   - Drag artwork to position it
   - Use zoom controls to resize
   - Rotate artwork as needed
   - Reset to default position
8. User closes AR viewer when done

## Usage Example

```tsx
import { ARViewButton } from '@/components/ARViewButton';

function ProductPage({ product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      {product.imageUrl && (
        <ARViewButton
          imageUrl={product.imageUrl}
          artworkTitle={product.name}
          className="w-full"
        />
      )}
    </div>
  );
}
```

## Security Considerations

- Camera access requires HTTPS in production
- Camera stream is only active while AR viewer is open
- Camera is properly released when viewer closes
- No video recording or image capture functionality
- All processing happens client-side

## Performance

- Camera stream is cleaned up on component unmount
- Artwork images are pre-loaded from existing URLs
- Touch events use pointer capture for smooth dragging
- CSS transforms for efficient rendering

## Future Enhancements

Potential improvements for the AR feature:

1. **Size Reference**: Add real-world size indicators
2. **Multiple Artworks**: Compare multiple artworks side by side
3. **Save & Share**: Capture AR view as image for sharing
4. **3D Models**: Support for 3D artwork viewing
5. **AR Measurement**: Measure wall space with AR
6. **Lighting Adjustment**: Simulate different lighting conditions
7. **Frame Options**: Preview different frame styles

## Troubleshooting

### Camera Permission Denied

If users deny camera permission:
- Clear error message is displayed
- Option to close and try again
- Instructions to check browser settings

### Feature Not Showing

If AR button doesn't appear:
- Check browser compatibility
- Ensure device has camera
- Verify HTTPS connection (in production)
- Check that artwork has valid image URL

### Performance Issues

If AR viewer is slow or laggy:
- Reduce camera resolution in video constraints
- Optimize artwork image sizes
- Check device hardware capabilities
