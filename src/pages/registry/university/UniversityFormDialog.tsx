import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { universitiesApi, UniversityRow, Dictionary } from '@/api/universities.api';
import { toast } from 'sonner';
import { extractApiErrorMessage } from '@/utils/error.util';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, MapPin, Globe, Settings, Info, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Zod validation schema
const universitySchema = z.object({
  code: z.string().min(1, { message: 'Code is required' }).trim(),
  name: z.string().min(1, { message: 'Name is required' }).trim(),
  tin: z.string().optional(),
  ownershipCode: z.string().min(1, { message: 'Ownership type is required' }),
  universityTypeCode: z.string().min(1, { message: 'HEI type is required' }),
  regionCode: z.string().optional(),
  address: z.string().optional(),
  cadastre: z.string().optional(),
  universityUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  studentUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  teacherUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  uzbmbUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  mailAddress: z.string().optional(),
  bankInfo: z.string().optional(),
  accreditationInfo: z.string().optional(),
  active: z.boolean(),
  gpaEdit: z.boolean(),
  accreditationEdit: z.boolean(),
  addStudent: z.boolean(),
  allowGrouping: z.boolean(),
  allowTransferOutside: z.boolean(),
});

type UniversityFormData = z.infer<typeof universitySchema>;


interface UniversityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  university?: UniversityRow | null;
  onSuccess: () => void;
}

export default function UniversityFormDialog({
  open,
  onOpenChange,
  university,
  onSuccess,
}: UniversityFormDialogProps) {
  const { t } = useTranslation();
  const [dictionaries, setDictionaries] = useState<{
    regions: Dictionary[];
    ownerships: Dictionary[];
    types: Dictionary[];
  }>({ regions: [], ownerships: [], types: [] });

  const isEdit = !!university;

  // React Hook Form with Zod validation
  const form = useForm<UniversityFormData>({
    resolver: zodResolver(universitySchema),
    defaultValues: {
      code: '',
      name: '',
      tin: '',
      ownershipCode: '',
      universityTypeCode: '',
      regionCode: '',
      address: '',
      cadastre: '',
      universityUrl: '',
      studentUrl: '',
      teacherUrl: '',
      uzbmbUrl: '',
      mailAddress: '',
      bankInfo: '',
      accreditationInfo: '',
      active: true,
      gpaEdit: false,
      accreditationEdit: true,
      addStudent: false,
      allowGrouping: false,
      allowTransferOutside: true,
    },
  });

  const { handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = form;

  // Load dictionaries
  useEffect(() => {
    const loadDictionaries = async () => {
      try {
        const data = await universitiesApi.getDictionaries();
        setDictionaries(data);
      } catch (error) {
        // ⭐ Backend-driven i18n: Use backend's localized message
        toast.error(extractApiErrorMessage(error, t('Failed to load dictionaries')));
      }
    };
    if (open) {
      loadDictionaries();
    }
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (university && open) {
      reset({
        code: university.code,
        name: university.name,
        tin: university.tin || '',
        ownershipCode: university.ownershipCode || '',
        universityTypeCode: university.universityTypeCode || '',
        regionCode: university.regionCode || university.soatoRegion || '',
        address: university.address || '',
        cadastre: university.cadastre || '',
        universityUrl: university.universityUrl || '',
        studentUrl: university.studentUrl || '',
        teacherUrl: university.teacherUrl || '',
        uzbmbUrl: university.uzbmbUrl || '',
        mailAddress: university.mailAddress || '',
        bankInfo: university.bankInfo || '',
        accreditationInfo: university.accreditationInfo || '',
        active: university.active ?? true,
        gpaEdit: university.gpaEdit ?? false,
        accreditationEdit: university.accreditationEdit ?? true,
        addStudent: university.addStudent ?? false,
        allowGrouping: university.allowGrouping ?? false,
        allowTransferOutside: university.allowTransferOutside ?? true,
      });
    } else if (!university && open) {
      reset({
        code: '',
        name: '',
        tin: '',
        ownershipCode: '',
        universityTypeCode: '',
        regionCode: '',
        address: '',
        cadastre: '',
        universityUrl: '',
        studentUrl: '',
        teacherUrl: '',
        uzbmbUrl: '',
        mailAddress: '',
        bankInfo: '',
        accreditationInfo: '',
        active: true,
        gpaEdit: false,
        accreditationEdit: true,
        addStudent: false,
        allowGrouping: false,
        allowTransferOutside: true,
      });
    }
  }, [university, open, reset]);

  const onSubmit = async (data: UniversityFormData) => {
    try {
      if (isEdit) {
        await universitiesApi.updateUniversity(university.code, data);
        toast.success(t('University successfully updated'));
      } else {
        await universitiesApi.createUniversity(data);
        toast.success(t('University successfully created'));
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      // ⭐ Backend-driven i18n: Use backend's localized message
      toast.error(extractApiErrorMessage(error, isEdit ? t('Failed to update university') : t('Failed to create university')));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-5 border-b bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                {isEdit ? t('Edit HEI') : t('Add new HEI')}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                {isEdit ? t('Update data') : t('Enter new university data')}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="basic" className="flex-1 flex flex-col">
            <TabsList className="mx-6 mt-4 grid grid-cols-5 gap-1">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {t('Basic')}
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('Address')}
              </TabsTrigger>
              <TabsTrigger value="urls" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('Links')}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {t('Settings')}
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                {t('Additional')}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">
                      {t('Code')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      {...form.register('code')}
                      disabled={isEdit}
                      placeholder="00001"
                      className={errors.code ? 'border-red-500' : ''}
                    />
                    {errors.code && (
                      <p className="text-sm text-red-500">{t(errors.code.message!)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tin">{t('INN')}</Label>
                    <Input
                      id="tin"
                      {...form.register('tin')}
                      placeholder="123456789"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t('Name')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder={t('Full name of HEI')}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{t(errors.name.message!)}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      {t('Ownership type')} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch('ownershipCode')}
                      onValueChange={(value) => setValue('ownershipCode', value)}
                    >
                      <SelectTrigger className={errors.ownershipCode ? 'border-red-500' : ''}>
                        <SelectValue placeholder={t('Select')} />
                      </SelectTrigger>
                      <SelectContent>
                        {dictionaries.ownerships.map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.ownershipCode && (
                      <p className="text-sm text-red-500">{t(errors.ownershipCode.message!)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t('HEI type')} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch('universityTypeCode')}
                      onValueChange={(value) => setValue('universityTypeCode', value)}
                    >
                      <SelectTrigger className={errors.universityTypeCode ? 'border-red-500' : ''}>
                        <SelectValue placeholder={t('Select')} />
                      </SelectTrigger>
                      <SelectContent>
                        {dictionaries.types.map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.universityTypeCode && (
                      <p className="text-sm text-red-500">{t(errors.universityTypeCode.message!)}</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label>{t('Region')}</Label>
                  <Select
                    value={watch('regionCode')}
                    onValueChange={(value) => setValue('regionCode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {dictionaries.regions.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t('Address')}</Label>
                  <Textarea
                    id="address"
                    {...form.register('address')}
                    placeholder={t('Full address')}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mailAddress">{t('Mail address')}</Label>
                  <Textarea
                    id="mailAddress"
                    {...form.register('mailAddress')}
                    placeholder={t('Mail address')}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cadastre">{t('Cadastre number')}</Label>
                  <Input
                    id="cadastre"
                    {...form.register('cadastre')}
                    placeholder={t('Cadastre number')}
                  />
                </div>
              </TabsContent>

              {/* URLs Tab */}
              <TabsContent value="urls" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="universityUrl">{t('Official website')}</Label>
                  <Input
                    id="universityUrl"
                    {...form.register('universityUrl')}
                    type="url"
                    placeholder="https://university.uz"
                    className={errors.universityUrl ? 'border-red-500' : ''}
                  />
                  {errors.universityUrl && (
                    <p className="text-sm text-red-500">{t(errors.universityUrl.message!)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentUrl">{t('Students portal')}</Label>
                  <Input
                    id="studentUrl"
                    {...form.register('studentUrl')}
                    type="url"
                    placeholder="https://student.university.uz"
                    className={errors.studentUrl ? 'border-red-500' : ''}
                  />
                  {errors.studentUrl && (
                    <p className="text-sm text-red-500">{t(errors.studentUrl.message!)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacherUrl">{t('Teachers portal')}</Label>
                  <Input
                    id="teacherUrl"
                    {...form.register('teacherUrl')}
                    type="url"
                    placeholder="https://teacher.university.uz"
                    className={errors.teacherUrl ? 'border-red-500' : ''}
                  />
                  {errors.teacherUrl && (
                    <p className="text-sm text-red-500">{t(errors.teacherUrl.message!)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uzbmbUrl">UZBMB URL</Label>
                  <Input
                    id="uzbmbUrl"
                    {...form.register('uzbmbUrl')}
                    type="url"
                    placeholder="https://uzbmb.university.uz"
                    className={errors.uzbmbUrl ? 'border-red-500' : ''}
                  />
                  {errors.uzbmbUrl && (
                    <p className="text-sm text-red-500">{t(errors.uzbmbUrl.message!)}</p>
                  )}
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-3 mt-0">
                {[
                  { key: 'active' as const, label: t('Active') },
                  { key: 'gpaEdit' as const, label: t('GPA editing') },
                  { key: 'accreditationEdit' as const, label: t('Accreditation editing') },
                  { key: 'addStudent' as const, label: t('Add student') },
                  { key: 'allowGrouping' as const, label: t('Allow grouping') },
                  { key: 'allowTransferOutside' as const, label: t('Allow external transfer') },
                ].map((setting) => (
                  <div
                    key={setting.key}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Checkbox
                      id={setting.key}
                      checked={watch(setting.key)}
                      onCheckedChange={(checked) => setValue(setting.key, !!checked)}
                    />
                    <Label
                      htmlFor={setting.key}
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      {setting.label}
                    </Label>
                  </div>
                ))}
              </TabsContent>

              {/* Additional Tab */}
              <TabsContent value="additional" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="bankInfo">{t('Bank info')}</Label>
                  <Textarea
                    id="bankInfo"
                    {...form.register('bankInfo')}
                    placeholder={t('Bank details')}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accreditationInfo">{t('Accreditation info')}</Label>
                  <Textarea
                    id="accreditationInfo"
                    {...form.register('accreditationInfo')}
                    placeholder={t('Accreditation details')}
                    rows={3}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {t('Saving...')}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {isEdit ? t('Save') : t('Create')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}