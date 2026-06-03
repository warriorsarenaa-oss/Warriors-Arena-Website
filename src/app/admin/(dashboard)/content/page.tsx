"use client";

import { useState, useEffect } from "react";
import { Plus, X, Trash2, GripVertical, Image as ImageIcon, Save, Check } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/db/supabase-browser";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableRow({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <tr ref={setNodeRef} style={style} className={`bg-wa-bg border-b border-wa-green/10 hover:bg-wa-green/5 ${className || ''}`}>
      <td className="p-4 w-12" {...attributes} {...listeners}>
        <GripVertical className="w-5 h-5 text-wa-text/30 cursor-grab" />
      </td>
      {children}
    </tr>
  );
}

function SortableItemDiv({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div {...attributes} {...listeners} className="absolute top-2 left-2 z-10 bg-black/50 p-1 rounded cursor-grab">
        <GripVertical className="w-4 h-4 text-white" />
      </div>
      {children}
    </div>
  );
}

export default function CMSContentPage() {
  const [activeTab, setActiveTab] = useState<'HERO'|'LINEUP'|'MISSIONS'|'PROTOCOL'|'GALLERY'|'FAQ'|'CONTACT'>('HERO');
  
  // Data states
  const [cmsData, setCmsData] = useState<any>({});
  const [protocolSteps, setProtocolSteps] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string|null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [cmsRes, protoRes, galRes, faqRes] = await Promise.all([
        fetch('/api/v1/admin/cms'),
        fetch('/api/v1/admin/cms/protocol'),
        fetch('/api/v1/admin/cms/gallery'),
        fetch('/api/v1/admin/cms/faq')
      ]);

      if (cmsRes.ok) setCmsData(await cmsRes.json());
      if (protoRes.ok) setProtocolSteps(await protoRes.json());
      if (galRes.ok) setGalleryImages(await galRes.json());
      if (faqRes.ok) setFaqs(await faqRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCmsChange = (section: string, key: string, field: 'value_en' | 'value_ar', val: string) => {
    setCmsData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: { ...prev[section]?.[key], [field]: val }
      }
    }));
  };

  const handleSaveCMS = async (section: string) => {
    setSaving(true);
    try {
      const sectionData = cmsData[section];
      const updates = Object.entries(sectionData || {}).map(([key, val]: [string, any]) => ({
        section, key, value_en: val.value_en, value_ar: val.value_ar, content_type: val.content_type || 'text'
      }));
      
      const res = await fetch('/api/v1/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error("Failed to save");
      alert("Saved successfully!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Generic reorder save
  const saveReorder = async (endpoint: string, items: any[]) => {
    await fetch(`/api/v1/admin/cms/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items.map((it, i) => ({ id: it.id, sort_order: i, step_number: i + 1 }))) // step_number for protocol
    });
  };

  // Protocols
  const addProtocol = async () => {
    const newStep = { step_number: protocolSteps.length + 1, title_en: "New Step", title_ar: "خطوة جديدة", description_en: "...", description_ar: "...", icon: "crosshair", is_active: true };
    const res = await fetch('/api/v1/admin/cms/protocol', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newStep) });
    if(res.ok) loadData();
  };
  const updateProtocol = async (id: string, updates: any) => {
    setProtocolSteps(steps => steps.map(s => s.id === id ? { ...s, ...updates } : s));
    await fetch('/api/v1/admin/cms/protocol', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) });
  };
  const deleteProtocol = async (id: string) => {
    if(!confirm("Delete this step?")) return;
    await fetch(`/api/v1/admin/cms/protocol?id=${id}`, { method: 'DELETE' });
    loadData();
  };

  // FAQs
  const addFaq = async () => {
    const newFaq = { question_en: "New Question?", answer_en: "Answer", sort_order: faqs.length, is_active: true };
    await fetch('/api/v1/admin/cms/faq', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newFaq) });
    loadData();
  };
  const updateFaq = async (id: string, updates: any) => {
    setFaqs(faqs => faqs.map(f => f.id === id ? { ...f, ...updates } : f));
    await fetch('/api/v1/admin/cms/faq', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) });
  };
  const deleteFaq = async (id: string) => {
    if(!confirm("Delete FAQ?")) return;
    await fetch(`/api/v1/admin/cms/faq?id=${id}`, { method: 'DELETE' });
    loadData();
  };

  // Upload helpers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading('uploading...');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `cms/${fileName}`;

      const { error } = await supabaseBrowser.storage.from('games-assets').upload(filePath, file);
      if (error) throw error;
      
      const { data: { publicUrl } } = supabaseBrowser.storage.from('games-assets').getPublicUrl(filePath);

      if (isGallery) {
        await fetch('/api/v1/admin/cms/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: publicUrl, alt_en: "Gallery Image", alt_ar: "صورة المعرض", sort_order: galleryImages.length })
        });
        loadData();
      } else {
        handleCmsChange('hero', 'hero_image_url', 'value_en', publicUrl);
      }
    } catch(err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(null);
    }
  };

  const deleteGalleryImage = async (id: string) => {
    if(!confirm("Delete image?")) return;
    await fetch(`/api/v1/admin/cms/gallery?id=${id}`, { method: 'DELETE' });
    loadData();
  };

  if (loading) return <div className="p-8 text-wa-green animate-pulse">Loading CMS Data...</div>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">CONTENT</h1>
          <p className="text-wa-text/60 uppercase text-xs tracking-wider">Manage website copy and media</p>
        </div>
      </div>

      <div className="flex border-b border-wa-green/20 gap-4 overflow-x-auto">
        {['HERO', 'LINEUP', 'MISSIONS', 'PROTOCOL', 'GALLERY', 'FAQ', 'CONTACT'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 px-4 uppercase text-sm tracking-widest font-bold whitespace-nowrap transition-colors ${activeTab === tab ? 'text-wa-green border-b-2 border-wa-green' : 'text-wa-text/50 hover:text-wa-text'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <WAPanel className="p-6">
        {/* HERO TAB */}
        {activeTab === 'HERO' && (
          <div className="flex flex-col gap-8">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold font-heading text-wa-green">Hero Section</h2>
              <WAButton onClick={() => handleSaveCMS('hero')} disabled={saving} className="bg-wa-green text-wa-bg text-sm py-1 px-4">
                <Save className="w-4 h-4 mr-2 inline" /> {saving ? "SAVING..." : "SAVE HERO"}
              </WAButton>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'location_badge', label: 'Location Badge' },
                { key: 'slogan_line1', label: 'Slogan Line 1' },
                { key: 'slogan_line2', label: 'Slogan Line 2' }
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
                  <label className="text-xs uppercase text-wa-green/80">{f.label}</label>
                  <input type="text" value={cmsData.hero?.[f.key]?.value_en || ''} onChange={e => handleCmsChange('hero', f.key, 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green" placeholder="English" />
                  <input type="text" value={cmsData.hero?.[f.key]?.value_ar || ''} onChange={e => handleCmsChange('hero', f.key, 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green text-right" placeholder="Arabic" dir="rtl" />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
              <label className="text-xs uppercase text-wa-green/80">Subtitle Paragraph</label>
              <textarea value={cmsData.hero?.subtitle?.value_en || ''} onChange={e => handleCmsChange('hero', 'subtitle', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded h-20" placeholder="English" />
              <textarea value={cmsData.hero?.subtitle?.value_ar || ''} onChange={e => handleCmsChange('hero', 'subtitle', 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded h-20 text-right" placeholder="Arabic" dir="rtl" />
            </div>

            <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
              <label className="text-xs uppercase text-wa-green/80">Hero Background Image</label>
              <div className="flex gap-4 items-center">
                {cmsData.hero?.hero_image_url?.value_en ? (
                  <div className="relative h-20 w-40 rounded overflow-hidden">
                    <Image unoptimized fill src={cmsData.hero.hero_image_url.value_en} alt="Hero" className="object-cover" />
                  </div>
                ) : <div className="h-20 w-40 bg-wa-text/10 rounded flex items-center justify-center text-xs">No Image</div>}
                
                <label className="bg-wa-green/10 text-wa-green px-4 py-2 rounded cursor-pointer hover:bg-wa-green/20">
                  {uploading ? 'UPLOADING...' : 'UPLOAD NEW IMAGE'}
                  <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, false)} />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
              <label className="text-xs uppercase text-wa-green/80">Marquee Ticker Items (comma-separated)</label>
              <input type="text" value={cmsData.hero?.marquee_items?.value_en || ''} onChange={e => handleCmsChange('hero', 'marquee_items', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green" placeholder="LASER TAG, GEL BLASTERS, ..." />
              <input type="text" value={cmsData.hero?.marquee_items?.value_ar || ''} onChange={e => handleCmsChange('hero', 'marquee_items', 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green text-right" placeholder="LASER TAG, GEL BLASTERS, ..." dir="rtl" />
            </div>

            <h3 className="text-lg font-bold text-wa-green mt-4">Stat Cards (Hero)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(num => (
                <div key={num} className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
                  <label className="text-xs uppercase text-wa-text/50">Stat {num}</label>
                  <input type="text" value={cmsData.hero?.[`stat${num}_value`]?.value_en || ''} onChange={e => handleCmsChange('hero', `stat${num}_value`, 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-1 text-sm font-bold" placeholder="Value (EN)" />
                  <input type="text" value={cmsData.hero?.[`stat${num}_value`]?.value_ar || ''} onChange={e => handleCmsChange('hero', `stat${num}_value`, 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-1 text-sm font-bold text-right" placeholder="Value (AR)" dir="rtl" />
                  <input type="text" value={cmsData.hero?.[`stat${num}_label`]?.value_en || ''} onChange={e => handleCmsChange('hero', `stat${num}_label`, 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-1 text-xs" placeholder="Label (EN)" />
                  <input type="text" value={cmsData.hero?.[`stat${num}_label`]?.value_ar || ''} onChange={e => handleCmsChange('hero', `stat${num}_label`, 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-1 text-xs text-right" placeholder="Label (AR)" dir="rtl" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LINEUP TAB */}
        {activeTab === 'LINEUP' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold font-heading text-wa-green">Lineup Section</h2>
              <WAButton onClick={() => handleSaveCMS('lineup')} disabled={saving} className="bg-wa-green text-wa-bg text-sm py-1 px-4">
                <Save className="w-4 h-4 mr-2 inline" /> SAVE LINEUP
              </WAButton>
            </div>
            
            <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
              <label className="text-xs uppercase text-wa-green/80">Heading</label>
              <input type="text" value={cmsData.lineup?.heading?.value_en || ''} onChange={e => handleCmsChange('lineup', 'heading', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2" placeholder="English" />
              <input type="text" value={cmsData.lineup?.heading?.value_ar || ''} onChange={e => handleCmsChange('lineup', 'heading', 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 text-right" placeholder="Arabic" dir="rtl" />
            </div>

            <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
              <label className="text-xs uppercase text-wa-green/80">Subheading</label>
              <textarea value={cmsData.lineup?.subheading?.value_en || ''} onChange={e => handleCmsChange('lineup', 'subheading', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 h-20" placeholder="English" />
              <textarea value={cmsData.lineup?.subheading?.value_ar || ''} onChange={e => handleCmsChange('lineup', 'subheading', 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 h-20 text-right" placeholder="Arabic" dir="rtl" />
            </div>
            
            <p className="text-xs opacity-50 mt-4">* Note: Game cards displayed in this section are managed in the GAMES tab.</p>
          </div>
        )}

        {/* MISSIONS TAB */}
        {activeTab === 'MISSIONS' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold font-heading text-wa-green">Missions Section</h2>
              <WAButton onClick={() => handleSaveCMS('missions')} disabled={saving} className="bg-wa-green text-wa-bg text-sm py-1 px-4">
                <Save className="w-4 h-4 mr-2 inline" /> SAVE MISSIONS
              </WAButton>
            </div>
            
            <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
              <label className="text-xs uppercase text-wa-green/80">Heading</label>
              <input type="text" value={cmsData.missions?.heading?.value_en || ''} onChange={e => handleCmsChange('missions', 'heading', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2" placeholder="English" />
              <input type="text" value={cmsData.missions?.heading?.value_ar || ''} onChange={e => handleCmsChange('missions', 'heading', 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 text-right" placeholder="Arabic" dir="rtl" />
            </div>

            <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
              <label className="text-xs uppercase text-wa-green/80">Subheading</label>
              <textarea value={cmsData.missions?.subheading?.value_en || ''} onChange={e => handleCmsChange('missions', 'subheading', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 h-20" placeholder="English" />
              <textarea value={cmsData.missions?.subheading?.value_ar || ''} onChange={e => handleCmsChange('missions', 'subheading', 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 h-20 text-right" placeholder="Arabic" dir="rtl" />
            </div>

            <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
              <label className="text-xs uppercase text-wa-green/80">Add-on Badge Text</label>
              <input type="text" value={cmsData.missions?.addon_badge?.value_en || ''} onChange={e => handleCmsChange('missions', 'addon_badge', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2" placeholder="English" />
              <input type="text" value={cmsData.missions?.addon_badge?.value_ar || ''} onChange={e => handleCmsChange('missions', 'addon_badge', 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 text-right" placeholder="Arabic" dir="rtl" />
            </div>
            
            <p className="text-xs opacity-50 mt-4">* Note: Individual mission cards are managed in the MISSIONS sidebar menu.</p>
          </div>
        )}

        {/* PROTOCOL TAB */}
        {activeTab === 'PROTOCOL' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold font-heading text-wa-green">Protocol Steps</h2>
              <div className="flex gap-4">
                <WAButton onClick={addProtocol} className="bg-transparent border border-wa-green text-wa-green text-sm py-1 px-4">+ ADD STEP</WAButton>
                <WAButton onClick={() => handleSaveCMS('protocol')} disabled={saving} className="bg-wa-green text-wa-bg text-sm py-1 px-4">
                  <Save className="w-4 h-4 mr-2 inline" /> SAVE PROTOCOL CMS
                </WAButton>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
              <label className="text-xs uppercase text-wa-green/80">Heading</label>
              <input type="text" value={cmsData.protocol?.heading?.value_en || ''} onChange={e => handleCmsChange('protocol', 'heading', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2" placeholder="English (e.g. MISSION PROTOCOL)" />
              <input type="text" value={cmsData.protocol?.heading?.value_ar || ''} onChange={e => handleCmsChange('protocol', 'heading', 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 text-right" placeholder="Arabic (e.g. خطوات التشغيل)" dir="rtl" />
            </div>

            <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
              <label className="text-xs uppercase text-wa-green/80">Subheading</label>
              <textarea value={cmsData.protocol?.subheading?.value_en || ''} onChange={e => handleCmsChange('protocol', 'subheading', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 h-20" placeholder="English" />
              <textarea value={cmsData.protocol?.subheading?.value_ar || ''} onChange={e => handleCmsChange('protocol', 'subheading', 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 h-20 text-right" placeholder="Arabic" dir="rtl" />
            </div>
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
              const { active, over } = e;
              if (active.id !== over?.id) {
                const oldIndex = protocolSteps.findIndex((s) => s.id === active.id);
                const newIndex = protocolSteps.findIndex((s) => s.id === over?.id);
                const newArr = arrayMove(protocolSteps, oldIndex, newIndex);
                setProtocolSteps(newArr);
                saveReorder('protocol', newArr);
              }
            }}>
              <table className="w-full text-left text-sm">
                <tbody className="flex flex-col gap-4">
                  <SortableContext items={protocolSteps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {protocolSteps.map((step) => (
                      <SortableRow key={step.id} id={step.id} className="block border border-wa-green/20 rounded p-4">
                        <div className="flex flex-col gap-4 pl-4 w-full">
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold text-wa-green text-lg">Step {step.step_number}</span>
                            <div className="flex gap-4">
                               <label className="flex items-center cursor-pointer gap-2">
                                <span className="text-xs">Active</span>
                                <input type="checkbox" checked={step.is_active} onChange={e => updateProtocol(step.id, {is_active: e.target.checked})} />
                              </label>
                              <button onClick={() => deleteProtocol(step.id)} className="text-wa-red"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                              <input type="text" value={step.title_en} onChange={e => updateProtocol(step.id, {title_en: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 font-bold" placeholder="Title (EN)" />
                              <textarea value={step.description_en} onChange={e => updateProtocol(step.id, {description_en: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 h-20 text-xs" placeholder="Description (EN)" />
                            </div>
                            <div className="flex flex-col gap-2">
                              <input type="text" value={step.title_ar || ''} onChange={e => updateProtocol(step.id, {title_ar: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 font-bold text-right" placeholder="Title (AR)" dir="rtl" />
                              <textarea value={step.description_ar || ''} onChange={e => updateProtocol(step.id, {description_ar: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 h-20 text-xs text-right" placeholder="Description (AR)" dir="rtl" />
                            </div>
                          </div>
                        </div>
                      </SortableRow>
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </DndContext>
          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === 'GALLERY' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-heading text-wa-green">Gallery Images</h2>
              <label className="bg-wa-green text-wa-bg text-sm py-2 px-4 rounded font-bold cursor-pointer flex items-center">
                {uploading ? 'UPLOADING...' : '+ UPLOAD IMAGE'}
                <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, true)} />
              </label>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
              const { active, over } = e;
              if (active.id !== over?.id) {
                const oldIndex = galleryImages.findIndex((s) => s.id === active.id);
                const newIndex = galleryImages.findIndex((s) => s.id === over?.id);
                const newArr = arrayMove(galleryImages, oldIndex, newIndex);
                setGalleryImages(newArr);
                saveReorder('gallery', newArr);
              }
            }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SortableContext items={galleryImages.map(s => s.id)}>
                  {galleryImages.map((img) => (
                    <SortableItemDiv key={img.id} id={img.id} className="relative border border-wa-green/20 rounded overflow-hidden aspect-square group bg-wa-bg">
                      <Image unoptimized fill src={img.url} className={`object-cover transition-all ${!img.is_active ? 'opacity-30 grayscale' : ''}`} alt="" />
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-2">
                         <input type="text" defaultValue={img.alt_en} onBlur={e => fetch('/api/v1/admin/cms/gallery', {method: 'POST', body: JSON.stringify([{id: img.id, alt_en: e.target.value}])})} className="bg-black/50 border border-white/20 p-1 text-xs text-white" placeholder="Alt EN" />
                         <input type="text" defaultValue={img.alt_ar} onBlur={e => fetch('/api/v1/admin/cms/gallery', {method: 'POST', body: JSON.stringify([{id: img.id, alt_ar: e.target.value}])})} className="bg-black/50 border border-white/20 p-1 text-xs text-white text-right" placeholder="Alt AR" dir="rtl" />
                         <div className="flex justify-between mt-1">
                           <button onClick={async () => {
                             const act = !img.is_active;
                             setGalleryImages(gi => gi.map(g => g.id === img.id ? {...g, is_active: act} : g));
                             await fetch('/api/v1/admin/cms/gallery', {method: 'POST', body: JSON.stringify([{id: img.id, is_active: act}])});
                           }} className="text-xs text-white bg-white/20 px-2 py-1 rounded">{img.is_active ? 'Disable' : 'Enable'}</button>
                           <button onClick={() => deleteGalleryImage(img.id)} className="bg-red-500/80 text-white p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                         </div>
                      </div>
                    </SortableItemDiv>
                  ))}
                </SortableContext>
              </div>
            </DndContext>
          </div>
        )}

        {/* FAQ TAB */}
        {activeTab === 'FAQ' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold font-heading text-wa-green">Frequently Asked Questions</h2>
              <div className="flex gap-4">
                <WAButton onClick={addFaq} className="bg-transparent border border-wa-green text-wa-green text-sm py-1 px-4">+ ADD FAQ</WAButton>
                <WAButton onClick={() => handleSaveCMS('faq')} disabled={saving} className="bg-wa-green text-wa-bg text-sm py-1 px-4">
                  <Save className="w-4 h-4 mr-2 inline" /> SAVE FAQ CMS
                </WAButton>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
              <label className="text-xs uppercase text-wa-green/80">Heading</label>
              <input type="text" value={cmsData.faq?.heading?.value_en || ''} onChange={e => handleCmsChange('faq', 'heading', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2" placeholder="English (e.g. MISSION INTEL)" />
              <input type="text" value={cmsData.faq?.heading?.value_ar || ''} onChange={e => handleCmsChange('faq', 'heading', 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 text-right" placeholder="Arabic (e.g. أسألة شأعة)" dir="rtl" />
            </div>

            <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
              <label className="text-xs uppercase text-wa-green/80">Subheading</label>
              <textarea value={cmsData.faq?.subheading?.value_en || ''} onChange={e => handleCmsChange('faq', 'subheading', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 h-20" placeholder="English" />
              <textarea value={cmsData.faq?.subheading?.value_ar || ''} onChange={e => handleCmsChange('faq', 'subheading', 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 h-20 text-right" placeholder="Arabic" dir="rtl" />
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
              const { active, over } = e;
              if (active.id !== over?.id) {
                const oldIndex = faqs.findIndex((s) => s.id === active.id);
                const newIndex = faqs.findIndex((s) => s.id === over?.id);
                const newArr = arrayMove(faqs, oldIndex, newIndex);
                setFaqs(newArr);
                saveReorder('faq', newArr);
              }
            }}>
              <table className="w-full text-left text-sm">
                <tbody className="flex flex-col gap-4">
                  <SortableContext items={faqs.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {faqs.map((faq) => (
                      <SortableRow key={faq.id} id={faq.id} className="block border border-wa-green/20 rounded p-4">
                        <div className="flex flex-col gap-4 pl-4 w-full">
                          <div className="flex justify-end items-center w-full gap-4">
                             <label className="flex items-center cursor-pointer gap-2">
                              <span className="text-xs">Active</span>
                              <input type="checkbox" checked={faq.is_active} onChange={e => updateFaq(faq.id, {is_active: e.target.checked})} />
                            </label>
                            <button onClick={() => deleteFaq(faq.id)} className="text-wa-red"><Trash2 className="w-4 h-4"/></button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                              <input type="text" value={faq.question_en} onChange={e => updateFaq(faq.id, {question_en: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 font-bold" placeholder="Question (EN)" />
                              <textarea value={faq.answer_en} onChange={e => updateFaq(faq.id, {answer_en: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 h-20 text-xs" placeholder="Answer (EN)" />
                            </div>
                            <div className="flex flex-col gap-2">
                              <input type="text" value={faq.question_ar || ''} onChange={e => updateFaq(faq.id, {question_ar: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 font-bold text-right" placeholder="Question (AR)" dir="rtl" />
                              <textarea value={faq.answer_ar || ''} onChange={e => updateFaq(faq.id, {answer_ar: e.target.value})} className="bg-transparent border border-wa-text/20 p-2 h-20 text-xs text-right" placeholder="Answer (AR)" dir="rtl" />
                            </div>
                          </div>
                        </div>
                      </SortableRow>
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </DndContext>
          </div>
        )}

        {/* CONTACT / RALLY POINT TAB */}
        {activeTab === 'CONTACT' && (
          <div className="flex flex-col gap-8">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold font-heading text-wa-green">Contact / Rally Point</h2>
              <WAButton onClick={() => handleSaveCMS('contact')} disabled={saving} className="bg-wa-green text-wa-bg text-sm py-1 px-4">
                <Save className="w-4 h-4 mr-2 inline" /> {saving ? "SAVING..." : "SAVE CONTACT"}
              </WAButton>
            </div>
            
            <div className="bg-wa-green/10 border border-wa-green/20 p-4 rounded text-sm text-wa-green/80 flex items-center gap-2">
               <Check className="w-5 h-5"/> Operating hours are automatically synced from the HOURS admin page.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'contact_heading', label: 'Section Title (e.g. RALLY POINT)' },
                { key: 'contact_address', label: 'Address Text' },
                { key: 'contact_tagline', label: 'Location Tagline (Top-right)' },
                { key: 'contact_hours_display', label: '⏱ Operating Hours Display (overrides settings page)' },
                { key: 'address_label', label: 'Address Label (e.g. Address)' },
                { key: 'contact_label', label: 'Contact Label (e.g. Contact / تواصل معنا)' },
                { key: 'directions_cta', label: 'Directions Button text' },
                { key: 'whatsapp_cta', label: 'WhatsApp Button text' },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
                  <label className="text-xs uppercase text-wa-green/80">{f.label}</label>
                  <input type="text" value={cmsData.contact?.[f.key]?.value_en || ''} onChange={e => handleCmsChange('contact', f.key, 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green" placeholder="English" />
                  <input type="text" value={cmsData.contact?.[f.key]?.value_ar || ''} onChange={e => handleCmsChange('contact', f.key, 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green text-right" placeholder="Arabic" dir="rtl" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
                <label className="text-xs uppercase text-wa-green/80">WhatsApp (with +20)</label>
                <input type="text" value={cmsData.contact?.contact_whatsapp?.value_en || ''} onChange={e => handleCmsChange('contact', 'contact_whatsapp', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green" placeholder="+20..." />
              </div>
              <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
                <label className="text-xs uppercase text-wa-green/80">Instagram Handle</label>
                <input type="text" value={cmsData.contact?.contact_instagram?.value_en || ''} onChange={e => handleCmsChange('contact', 'contact_instagram', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green" placeholder="@..." />
              </div>
              <div className="flex flex-col gap-2 p-4 border border-wa-green/10 rounded">
                <label className="text-xs uppercase text-wa-green/80">Google Maps URL</label>
                <input type="text" value={cmsData.contact?.contact_maps_url?.value_en || ''} onChange={e => handleCmsChange('contact', 'contact_maps_url', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green" placeholder="https://goo.gl/maps/..." />
              </div>
            </div>

            <div className="border border-wa-green/10 rounded p-4 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-wa-green uppercase tracking-widest">Instagram Button</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-wa-green/80">Display Name (EN)</label>
                  <input type="text" value={cmsData.contact?.contact_instagram_label?.value_en || ''} onChange={e => handleCmsChange('contact', 'contact_instagram_label', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green" placeholder="e.g. Warriors Arena" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-wa-green/80">Display Name (AR)</label>
                  <input type="text" value={cmsData.contact?.contact_instagram_label?.value_ar || ''} onChange={e => handleCmsChange('contact', 'contact_instagram_label', 'value_ar', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green text-right" placeholder="e.g. وورييرز أرينا" dir="rtl" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase text-wa-green/80">Instagram Full URL (optional — overrides the handle)</label>
                <input type="text" value={cmsData.contact?.contact_instagram_url?.value_en || ''} onChange={e => handleCmsChange('contact', 'contact_instagram_url', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green" placeholder="https://www.instagram.com/warriors_arenaa/" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase text-wa-green/80">Instagram Handle (used if no URL above)</label>
                <input type="text" value={cmsData.contact?.contact_instagram?.value_en || ''} onChange={e => handleCmsChange('contact', 'contact_instagram', 'value_en', e.target.value)} className="bg-transparent border border-wa-text/20 p-2 rounded focus:border-wa-green" placeholder="warriors_arenaa" />
              </div>
            </div>

            <p className="text-sm opacity-70">Changes here will reflect on the "Find Us" section of the landing page.</p>
          </div>
        )}

      </WAPanel>
    </div>
  );
}
