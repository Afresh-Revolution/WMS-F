import { Header } from '../../../components/layout'
import { Button, Card, Input } from '../../../components/ui'

export function SettingsPage() {
  return (
    <div className="page">
      <Header title="Settings" subtitle="Profile and workspace preferences" />
      <Card title="Profile">
        <form className="stack">
          <Input label="Display name" name="displayName" defaultValue="Alex Admin" />
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue="alex@afresh.local"
          />
          <Button type="button">Save changes</Button>
        </form>
      </Card>
    </div>
  )
}
