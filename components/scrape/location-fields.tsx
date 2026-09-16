"use client";

import { useEffect, useMemo, useState } from "react";
import { GetCity, GetCountries, GetState } from "react-country-state-city";
import type {
  City,
  Country,
  State,
} from "react-country-state-city/dist/esm/types";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  SearchableSelect,
  type SearchableOption,
} from "@/components/ui/searchable-select";

type LocationFieldsProps = {
  country: string;
  state: string;
  city: string;
  area: string;
  countryError?: string;
  stateError?: string;
  cityError?: string;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onAreaChange: (value: string) => void;
};

function toOptions(
  rows: Array<{ id: number; name: string; keywords?: string }>,
): SearchableOption[] {
  return rows
    .map((row) => ({
      value: row.name,
      label: row.name,
      keywords: row.keywords ?? String(row.id),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function LocationFields({
  country,
  state,
  city,
  area,
  countryError,
  stateError,
  cityError,
  onCountryChange,
  onStateChange,
  onCityChange,
  onAreaChange,
}: LocationFieldsProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const selectedCountry = useMemo(
    () => countries.find((row) => row.name === country) ?? null,
    [countries, country],
  );
  const selectedState = useMemo(
    () => states.find((row) => row.name === state) ?? null,
    [states, state],
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingCountries(true);
    void GetCountries()
      .then((rows) => {
        if (!cancelled) {
          setCountries(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCountries([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingCountries(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCountry) {
      setStates([]);
      return;
    }
    let cancelled = false;
    setLoadingStates(true);
    void GetState(selectedCountry.id)
      .then((rows) => {
        if (!cancelled) {
          setStates(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStates([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingStates(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCountry]);

  useEffect(() => {
    if (!selectedCountry || !selectedState) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoadingCities(true);
    void GetCity(selectedCountry.id, selectedState.id)
      .then((rows) => {
        if (!cancelled) {
          setCities(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCities([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingCities(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCountry, selectedState]);

  const countryOptions = useMemo(
    () =>
      toOptions(
        countries.map((row) => ({
          id: row.id,
          name: row.name,
          keywords: `${row.iso2} ${row.iso3} ${row.native}`,
        })),
      ),
    [countries],
  );
  const stateOptions = useMemo(() => toOptions(states), [states]);
  const cityOptions = useMemo(() => toOptions(cities), [cities]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field
          id="country"
          label="Country"
          hint="Search and select a country."
          error={countryError}
        >
          <SearchableSelect
            id="country"
            name="country"
            value={country}
            options={countryOptions}
            loading={loadingCountries}
            invalid={Boolean(countryError)}
            required
            placeholder="Select country"
            searchPlaceholder="Search countries…"
            onChange={(next) => {
              onCountryChange(next);
              onStateChange("");
              onCityChange("");
            }}
          />
        </Field>
      </div>

      <Field
        id="state"
        label="State / region"
        hint={
          country
            ? "Search within the selected country."
            : "Choose a country first."
        }
        error={stateError}
      >
        <SearchableSelect
          id="state"
          name="state"
          value={state}
          options={stateOptions}
          loading={loadingStates}
          disabled={!country}
          invalid={Boolean(stateError)}
          required
          placeholder={country ? "Select state" : "Select country first"}
          searchPlaceholder="Search states…"
          onChange={(next) => {
            onStateChange(next);
            onCityChange("");
          }}
        />
      </Field>

      <Field
        id="city"
        label="City"
        hint={
          state ? "Search within the selected state." : "Choose a state first."
        }
        error={cityError}
      >
        <SearchableSelect
          id="city"
          name="city"
          value={city}
          options={cityOptions}
          loading={loadingCities}
          disabled={!state}
          invalid={Boolean(cityError)}
          required
          placeholder={state ? "Select city" : "Select state first"}
          searchPlaceholder="Search cities…"
          onChange={onCityChange}
        />
      </Field>

      <div className="sm:col-span-2">
        <Field
          id="area"
          label="Area / locality"
          optional
          hint="Optional neighbourhood within the city (e.g. Adajan)."
        >
          <Input
            name="area"
            value={area}
            onChange={(event) => onAreaChange(event.target.value)}
            placeholder="Adajan, Vesu, downtown…"
            autoComplete="address-level3"
          />
        </Field>
      </div>
    </div>
  );
}
