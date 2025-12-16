"use client";

import * as React from "react";
import type { Store, StoreBrand } from "@repo/database/types";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";

type StoreWithBrand = Store & { brand: StoreBrand };

interface StoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store?: StoreWithBrand | null;
  brands: StoreBrand[];
  onSubmit: (data: {
    brandId: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    countryCode: string;
    latitude: number;
    longitude: number;
  }) => void;
  isPending?: boolean;
}

export function StoreDialog({
  open,
  onOpenChange,
  store,
  brands,
  onSubmit,
  isPending = false,
}: StoreDialogProps) {
  const [brandId, setBrandId] = React.useState("");
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [zip, setZip] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("US");
  const [latitude, setLatitude] = React.useState("");
  const [longitude, setLongitude] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or store changes
  React.useEffect(() => {
    if (open) {
      setBrandId(store?.brandId || "");
      setName(store?.name || "");
      setAddress(store?.address || "");
      setCity(store?.city || "");
      setState(store?.state || "");
      setZip(store?.zip || "");
      setCountryCode(store?.countryCode || "US");
      setLatitude(store?.latitude?.toString() || "");
      setLongitude(store?.longitude?.toString() || "");
      setErrors({});
    }
  }, [open, store]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!brandId) newErrors.brandId = "Brand is required";
    if (!name.trim()) newErrors.name = "Name is required";
    if (!address.trim()) newErrors.address = "Address is required";
    if (!city.trim()) newErrors.city = "City is required";
    if (!state.trim()) newErrors.state = "State is required";
    if (!zip.trim()) newErrors.zip = "ZIP code is required";
    if (!countryCode.trim()) newErrors.countryCode = "Country code is required";

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (!latitude || isNaN(lat)) {
      newErrors.latitude = "Valid latitude is required";
    }
    if (!longitude || isNaN(lon)) {
      newErrors.longitude = "Valid longitude is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSubmit({
        brandId,
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        countryCode: countryCode.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });
    }
  };

  const isEditMode = !!store;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Store" : "Create Store"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the store details below."
              : "Add a new store location to your system."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="brandId">Brand</Label>
              <Select
                value={brandId}
                onValueChange={setBrandId}
                disabled={isPending || isEditMode}
              >
                <SelectTrigger id="brandId">
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[300px]">
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.brandId && (
                <p className="text-sm text-destructive">{errors.brandId}</p>
              )}
              {isEditMode && (
                <p className="text-xs text-muted-foreground">
                  Brand cannot be changed after creation
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Publix Super Market at Brickell"
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 1451 S Miami Ave"
                disabled={isPending}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Miami"
                  disabled={isPending}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="FL"
                  maxLength={2}
                  disabled={isPending}
                />
                {errors.state && (
                  <p className="text-sm text-destructive">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="33130"
                  disabled={isPending}
                />
                {errors.zip && (
                  <p className="text-sm text-destructive">{errors.zip}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="countryCode">Country Code</Label>
                <Input
                  id="countryCode"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                  placeholder="US"
                  maxLength={2}
                  disabled={isPending}
                />
                {errors.countryCode && (
                  <p className="text-sm text-destructive">
                    {errors.countryCode}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="25.7617"
                  disabled={isPending}
                />
                {errors.latitude && (
                  <p className="text-sm text-destructive">{errors.latitude}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-80.1918"
                  disabled={isPending}
                />
                {errors.longitude && (
                  <p className="text-sm text-destructive">{errors.longitude}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
