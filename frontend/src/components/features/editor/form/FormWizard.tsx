import * as Accordion from '@radix-ui/react-accordion'
import { useStudioStore } from '@/store/studio'
import PersonalInfoSection from './PersonalInfoSection'
import SocialNetworksSection from './SocialNetworksSection'
import AbstractSection from './AbstractSection'
import CareerSection from './CareerSection'
import TechnicalSkillsSection from './TechnicalSkillsSection'
import SyntaxErrorBanner from './SyntaxErrorBanner'
import {
  LanguagesSection,
  EducationSection,
  SideProjectsSection,
  CertificationsSection,
} from './SidebarSections'

export default function FormWizard() {
  const isYamlValid = useStudioStore((s) => s.isYamlValid)

  return (
    <div className="h-full overflow-y-auto px-4 py-6 bg-[var(--color-surface-subtle)] border-r border-[var(--color-border)] select-none">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="pb-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            Assistant Visuel No-Code
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Saisissez vos informations ci-dessous. Les modifications sont synchronisées en temps réel avec le YAML.
          </p>
        </div>

        {/* Syntax Error Warning Banner */}
        {!isYamlValid && <SyntaxErrorBanner />}

        {/* Lock Accordion UI when YAML syntax is invalid */}
        <div className={!isYamlValid ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
          <Accordion.Root type="single" collapsible className="space-y-3">
            {/* Section 1 : Infos Personnelles */}
            <Accordion.Item
              value="personal-info"
              className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-default)] overflow-hidden"
            >
              <Accordion.Header>
                <Accordion.Trigger className="w-full flex justify-between items-center px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)] cursor-pointer text-left transition-colors">
                  👤 Informations Personnelles
                  <span className="text-xs text-[var(--color-text-secondary)]">▼</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="px-4 pb-4 pt-2 border-t border-[var(--color-border)] bg-[var(--color-surface-default)]">
                <PersonalInfoSection />
              </Accordion.Content>
            </Accordion.Item>

            {/* Section 2 : Réseaux Sociaux */}
            <Accordion.Item
              value="social-networks"
              className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-default)] overflow-hidden"
            >
              <Accordion.Header>
                <Accordion.Trigger className="w-full flex justify-between items-center px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)] cursor-pointer text-left transition-colors">
                  🔗 Réseaux Sociaux
                  <span className="text-xs text-[var(--color-text-secondary)]">▼</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="px-4 pb-4 pt-2 border-t border-[var(--color-border)] bg-[var(--color-surface-default)]">
                <SocialNetworksSection />
              </Accordion.Content>
            </Accordion.Item>

            {/* Section 3 : Résumé Professionnel */}
            <Accordion.Item
              value="abstract"
              className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-default)] overflow-hidden"
            >
              <Accordion.Header>
                <Accordion.Trigger className="w-full flex justify-between items-center px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)] cursor-pointer text-left transition-colors">
                  📝 Résumé / Profil
                  <span className="text-xs text-[var(--color-text-secondary)]">▼</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="px-4 pb-4 pt-2 border-t border-[var(--color-border)] bg-[var(--color-surface-default)]">
                <AbstractSection />
              </Accordion.Content>
            </Accordion.Item>

            {/* Section 4 : Expérience Professionnelle */}
            <Accordion.Item
              value="career"
              className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-default)] overflow-hidden"
            >
              <Accordion.Header>
                <Accordion.Trigger className="w-full flex justify-between items-center px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)] cursor-pointer text-left transition-colors">
                  💼 Expérience Professionnelle
                  <span className="text-xs text-[var(--color-text-secondary)]">▼</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="px-4 pb-4 pt-2 border-t border-[var(--color-border)] bg-[var(--color-surface-default)]">
                <CareerSection />
              </Accordion.Content>
            </Accordion.Item>

            {/* Section 5 : Compétences Techniques */}
            <Accordion.Item
              value="skills"
              className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-default)] overflow-hidden"
            >
              <Accordion.Header>
                <Accordion.Trigger className="w-full flex justify-between items-center px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)] cursor-pointer text-left transition-colors">
                  🛠️ Compétences Techniques
                  <span className="text-xs text-[var(--color-text-secondary)]">▼</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="px-4 pb-4 pt-2 border-t border-[var(--color-border)] bg-[var(--color-surface-default)]">
                <TechnicalSkillsSection />
              </Accordion.Content>
            </Accordion.Item>

            {/* Section 6 : Langues */}
            <Accordion.Item
              value="languages"
              className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-default)] overflow-hidden"
            >
              <Accordion.Header>
                <Accordion.Trigger className="w-full flex justify-between items-center px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)] cursor-pointer text-left transition-colors">
                  🗣️ Langues
                  <span className="text-xs text-[var(--color-text-secondary)]">▼</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="px-4 pb-4 pt-2 border-t border-[var(--color-border)] bg-[var(--color-surface-default)]">
                <LanguagesSection />
              </Accordion.Content>
            </Accordion.Item>

            {/* Section 7 : Formations */}
            <Accordion.Item
              value="education"
              className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-default)] overflow-hidden"
            >
              <Accordion.Header>
                <Accordion.Trigger className="w-full flex justify-between items-center px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)] cursor-pointer text-left transition-colors">
                  🎓 Formations & Diplômes
                  <span className="text-xs text-[var(--color-text-secondary)]">▼</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="px-4 pb-4 pt-2 border-t border-[var(--color-border)] bg-[var(--color-surface-default)]">
                <EducationSection />
              </Accordion.Content>
            </Accordion.Item>

            {/* Section 8 : Projets Personnel */}
            <Accordion.Item
              value="side-projects"
              className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-default)] overflow-hidden"
            >
              <Accordion.Header>
                <Accordion.Trigger className="w-full flex justify-between items-center px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)] cursor-pointer text-left transition-colors">
                  🚀 Projets Personnels
                  <span className="text-xs text-[var(--color-text-secondary)]">▼</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="px-4 pb-4 pt-2 border-t border-[var(--color-border)] bg-[var(--color-surface-default)]">
                <SideProjectsSection />
              </Accordion.Content>
            </Accordion.Item>

            {/* Section 9 : Certifications */}
            <Accordion.Item
              value="certifications"
              className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-default)] overflow-hidden"
            >
              <Accordion.Header>
                <Accordion.Trigger className="w-full flex justify-between items-center px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)] cursor-pointer text-left transition-colors">
                  🏆 Certifications
                  <span className="text-xs text-[var(--color-text-secondary)]">▼</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="px-4 pb-4 pt-2 border-t border-[var(--color-border)] bg-[var(--color-surface-default)]">
                <CertificationsSection />
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Root>
        </div>
      </div>
    </div>
  )
}
