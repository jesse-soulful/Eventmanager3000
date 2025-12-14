import { useState, useEffect } from 'react';
import { X, FileText, Download, Eye } from 'lucide-react';
import { eventsApi, lineItemsApi } from '../lib/api';
import type { Event, LineItem, SubLineItemType, ModuleType } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum } from '@event-management/shared';
import { generateItineraryPDF, type ItineraryData } from '../lib/pdfGenerator';

interface ItineraryModalProps {
  eventId: string;
  artist: LineItem;
  subLineItemTypes: SubLineItemType[];
  onClose: () => void;
  onSave: () => void;
}

export function ItineraryModal({
  eventId,
  artist,
  subLineItemTypes,
  onClose,
  onSave,
}: ItineraryModalProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [itineraryData, setItineraryData] = useState<ItineraryData>({
    artistName: (artist.metadata as any)?.artistName || artist.name,
    eventName: '',
    venueAddress: '',
    promotorName: '',
    promotorPhone: '',
    artistLiaisonName: '',
    artistLiaisonPhone: '',
    runningOrder: '',
    stageSetDetails: '',
    travelDetails: '',
    hotelDetails: '',
    groundDetails: '',
    technicalRiderDetails: '',
  });
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);

  const findSubItemByTypeName = (typeNames: string[]): LineItem | undefined => {
    const subItems = artist.subLineItems || [];
    for (const subItem of subItems) {
      const metadata = (subItem.metadata as any) || {};
      const subItemTypeId = metadata.subItemType;
      
      // First, try to match by sub-line item type name
      if (subItemTypeId) {
        const subItemType = subLineItemTypes.find(t => t.id === subItemTypeId);
        if (subItemType) {
          const typeNameLower = subItemType.name.toLowerCase();
          if (typeNames.some(name => typeNameLower === name.toLowerCase() || typeNameLower.includes(name.toLowerCase()))) {
            return subItem;
          }
        }
      }
      
      // Fallback: check by sub-item name itself
      const itemNameLower = subItem.name.toLowerCase();
      if (typeNames.some(name => itemNameLower === name.toLowerCase() || itemNameLower.includes(name.toLowerCase()))) {
        return subItem;
      }
    }
    return undefined;
  };

  const extractItineraryData = () => {
    if (!event) return;

    // Extract notes from sub-items based on their exact type names
    // Match the default sub-line item types: "Travel Fee", "Ground Transportation", "Hotel Costs", "Technical Rider"
    const travelItem = findSubItemByTypeName(['Travel Fee', 'Travel']);
    const groundItem = findSubItemByTypeName(['Ground Transportation', 'Ground Transport']);
    const hotelItem = findSubItemByTypeName(['Hotel Costs', 'Hotel']);
    const techRiderItem = findSubItemByTypeName(['Technical Rider', 'Technical']);
    
    // Stage & Set Details - look for a sub-item with "Stage" or "Set" in the name
    // This might be a custom sub-item created by the user
    const stageSetItem = findSubItemByTypeName(['Stage', 'Set', 'Stage & Set']);

    setItineraryData({
      artistName: (artist.metadata as any)?.artistName || artist.name,
      eventName: event.name,
      eventBannerUrl: event.bannerImageUrl ? 
        (event.bannerImageUrl.startsWith('http') ? event.bannerImageUrl : `/api${event.bannerImageUrl}`) 
        : null,
      venueAddress: event.venueAddress || event.location || '',
      promotorName: event.promotorName || '',
      promotorPhone: event.promotorPhone || '',
      artistLiaisonName: event.artistLiaisonName || '',
      artistLiaisonPhone: event.artistLiaisonPhone || '',
      runningOrder: event.runningOrder || '',
      // Extract notes from sub-item descriptions
      stageSetDetails: stageSetItem?.description || '',
      travelDetails: travelItem?.description || '',
      hotelDetails: hotelItem?.description || '',
      groundDetails: groundItem?.description || '',
      technicalRiderDetails: techRiderItem?.description || '',
    });
  };

  const loadEventData = async () => {
    try {
      const response = await eventsApi.getById(eventId);
      setEvent(response.data);
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  useEffect(() => {
    if (event) {
      extractItineraryData();
    }
  }, [event, artist, subLineItemTypes]);

  const handlePreview = async () => {
    try {
      const pdf = await generateItineraryPDF(itineraryData);
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPreviewPdf(url);
    } catch (error) {
      console.error('Failed to generate PDF preview:', error);
      alert('Failed to generate PDF preview. Please try again.');
    }
  };

  const handleExport = async () => {
    try {
      const pdf = await generateItineraryPDF(itineraryData);
      const artistName = itineraryData.artistName.replace(/[^a-z0-9]/gi, '_');
      const eventName = itineraryData.eventName.replace(/[^a-z0-9]/gi, '_');
      pdf.save(`Itinerary_${artistName}_${eventName}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleFieldUpdate = async (field: keyof ItineraryData, value: string) => {
    setItineraryData({ ...itineraryData, [field]: value });
    
    // If updating a sub-item field, update or create the corresponding sub-line item
    let updated = false;
    let targetItem: LineItem | undefined;
    let subItemTypeName = '';
    let typeNames: string[] = [];

    if (field === 'travelDetails') {
      typeNames = ['Travel Fee', 'Travel'];
      subItemTypeName = 'Travel Fee';
    } else if (field === 'hotelDetails') {
      typeNames = ['Hotel Costs', 'Hotel'];
      subItemTypeName = 'Hotel Costs';
    } else if (field === 'groundDetails') {
      typeNames = ['Ground Transportation', 'Ground Transport'];
      subItemTypeName = 'Ground Transportation';
    } else if (field === 'technicalRiderDetails') {
      typeNames = ['Technical Rider', 'Technical'];
      subItemTypeName = 'Technical Rider';
    } else if (field === 'stageSetDetails') {
      typeNames = ['Stage', 'Set', 'Stage & Set'];
      subItemTypeName = 'Stage & Set';
    }

    targetItem = findSubItemByTypeName(typeNames);

    if (targetItem) {
      // Update existing sub-item
      try {
        await lineItemsApi.update(targetItem.id, { description: value });
        updated = true;
      } catch (error) {
        console.error('Failed to update sub-item:', error);
        alert('Failed to save changes. Please try again.');
      }
    } else if (value.trim() && subItemTypeName) {
      // Create new sub-item if value is provided
      try {
        // Find matching sub-line item type by exact name match first, then partial match
        const subItemType = subLineItemTypes.find(type => 
          typeNames.some(name => type.name.toLowerCase() === name.toLowerCase()) ||
          typeNames.some(name => type.name.toLowerCase().includes(name.toLowerCase()))
        );

        await lineItemsApi.create({
          moduleType: ModuleTypeEnum.ARTISTS,
          eventId,
          parentLineItemId: artist.id,
          name: subItemTypeName,
          description: value,
          metadata: {
            subItemType: subItemType?.id,
          },
        });
        updated = true;
      } catch (error) {
        console.error('Failed to create sub-item:', error);
        alert('Failed to create sub-item. Please try again.');
      }
    }

    if (updated) {
      onSave();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <div className="text-center">Loading itinerary data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-animate-overlay">
      <div className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-gray-700 modal-animate-content">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold gradient-text">Artist Itinerary</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Preview/Export Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handlePreview}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview PDF
            </button>
            <button
              onClick={handleExport}
              className="btn btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>

          {/* PDF Preview */}
          {previewPdf && (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">PDF Preview</h3>
                <button
                  onClick={() => setPreviewPdf(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <iframe
                src={previewPdf}
                className="w-full h-96 border border-gray-200 rounded"
                title="PDF Preview"
              />
            </div>
          )}

          {/* Event Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Event Details</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Event Name</label>
                <input
                  type="text"
                  className="input"
                  value={itineraryData.eventName}
                  readOnly
                />
              </div>
              <div>
                <label className="label">Venue Address</label>
                <input
                  type="text"
                  className="input"
                  value={itineraryData.venueAddress}
                  readOnly
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Promotor Name</label>
                  <input
                    type="text"
                    className="input"
                    value={itineraryData.promotorName}
                    readOnly
                  />
                </div>
                <div>
                  <label className="label">Promotor Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={itineraryData.promotorPhone}
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Artist Liaison Name</label>
                  <input
                    type="text"
                    className="input"
                    value={itineraryData.artistLiaisonName}
                    readOnly
                  />
                </div>
                <div>
                  <label className="label">Artist Liaison Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={itineraryData.artistLiaisonPhone}
                    readOnly
                  />
                </div>
              </div>
              <div>
                <label className="label">Running Order</label>
                <textarea
                  className="input"
                  rows={6}
                  value={itineraryData.runningOrder}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Artist Details - Editable */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Artist Details</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Stage & Set Details (Notes)</label>
                <textarea
                  className="input"
                  rows={4}
                  value={itineraryData.stageSetDetails}
                  onChange={(e) => handleFieldUpdate('stageSetDetails', e.target.value)}
                  placeholder="Enter stage and set details..."
                />
              </div>
              <div>
                <label className="label">Travel Details (Notes)</label>
                <textarea
                  className="input"
                  rows={4}
                  value={itineraryData.travelDetails}
                  onChange={(e) => handleFieldUpdate('travelDetails', e.target.value)}
                  placeholder="Enter travel details..."
                />
              </div>
              <div>
                <label className="label">Hotel Details (Notes)</label>
                <textarea
                  className="input"
                  rows={4}
                  value={itineraryData.hotelDetails}
                  onChange={(e) => handleFieldUpdate('hotelDetails', e.target.value)}
                  placeholder="Enter hotel details..."
                />
              </div>
              <div>
                <label className="label">Ground Details (Notes)</label>
                <textarea
                  className="input"
                  rows={4}
                  value={itineraryData.groundDetails}
                  onChange={(e) => handleFieldUpdate('groundDetails', e.target.value)}
                  placeholder="Enter ground transportation details..."
                />
              </div>
              <div>
                <label className="label">Technical Rider Details (Notes)</label>
                <textarea
                  className="input"
                  rows={4}
                  value={itineraryData.technicalRiderDetails}
                  onChange={(e) => handleFieldUpdate('technicalRiderDetails', e.target.value)}
                  placeholder="Enter technical rider details..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

