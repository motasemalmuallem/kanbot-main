import { STORY_POINTS, type StoryPoints } from "@shared/types/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { useLanguage } from "@shared/i18n/LanguageProvider";

export function PointsSelect({
  value,
  onChange,
  disabled,
}: {
  value: StoryPoints | null;
  onChange: (value: StoryPoints | null) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => onChange(next == null ? null : Number(next) as StoryPoints)}
    >
      <SelectTrigger aria-label={t("Story points")}><SelectValue placeholder={t("Not estimated")} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={null}>{t("Not estimated")}</SelectItem>
        {STORY_POINTS.map((points) => <SelectItem key={points} value={points}>{points}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
